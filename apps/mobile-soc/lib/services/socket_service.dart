import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../models/threat_event.dart';

class SocketService {
  late IO.Socket socket;
  
  // Using ValueNotifier to let the UI reactively update without heavy state managers
  final ValueNotifier<List<ThreatEvent>> threatEvents = ValueNotifier([]);
  final ValueNotifier<bool> isConnected = ValueNotifier(false);

  void initSocket() {
    // Connect to the Cloud Gateway on Local Network (Replace with your actual IP)
    // 192.168.141.98 is based on your current network config
    socket = IO.io('http://192.168.141.98:4000', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    socket.connect();

    socket.onConnect((_) {
      print('[Socket] Connected to SentinelAI Gateway');
      isConnected.value = true;
    });

    socket.onDisconnect((_) {
      print('[Socket] Disconnected');
      isConnected.value = false;
    });

    // Listen for the specific event emitted by our api-gateway
    socket.on('new_threat_event', (data) {
      if (data != null) {
        final event = ThreatEvent.fromJson(Map<String, dynamic>.from(data));
        // Add new events to the top of the list
        final currentList = List<ThreatEvent>.from(threatEvents.value);
        currentList.insert(0, event);
        
        // Keep list bounded to last 100 alerts
        if (currentList.length > 100) {
          currentList.removeLast();
        }
        
        threatEvents.value = currentList;
        print('[Alert] Parsed new threat: ${event.decision} - ${event.filename}');
      }
    });
  }

  void dispose() {
    socket.disconnect();
    socket.dispose();
  }
}

// Singleton instance to access globally
final socketService = SocketService();
