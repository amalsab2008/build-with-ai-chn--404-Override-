import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(const SentinelMobileApp());
}

class SentinelMobileApp extends StatelessWidget {
  const SentinelMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SentinelAI Mobile SOC',
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.cyan,
        scaffoldBackgroundColor: Colors.black,
        textTheme: GoogleFonts.firaCodeTextTheme(Theme.of(context).textTheme.apply(bodyColor: Colors.white, displayColor: Colors.cyanAccent)),
      ),
      home: const DashboardScreen(),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late IO.Socket socket;
  List<Map<String, dynamic>> incidentFeed = [];

  @override
  void initState() {
    super.initState();
    initSocket();
  }

  void initSocket() {
    // Connect to SentinelAI Identity Gateway
    // Note: For Android Emulator, use 10.0.2.2 instead of localhost
    socket = IO.io('http://10.0.2.2:4000', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    socket.connect();

    socket.onConnect((_) {
      print('Connected to Sentinel Gateway');
    });

    socket.on('new_threat_event', (data) {
      setState(() {
        incidentFeed.insert(0, Map<String, dynamic>.from(data));
      });
      // Trigger local OS push notification logic here
    });
  }

  void executePlaybook(String agentId, String playbook) {
    socket.emit('dispatch_soar', {
      'agentId': agentId,
      'playbook': playbook
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('SOAR Playbook [$playbook] Executed on $agentId'),
        backgroundColor: playbook == 'KILL_AND_CLEAN' ? Colors.red : Colors.green,
      )
    );
  }

  @override
  void dispose() {
    socket.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SENTINEL AI - MOBILE SOC', style: TextStyle(fontSize: 14, letterSpacing: 2, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.black,
        elevation: 1,
        shadowColor: Colors.cyanAccent.withOpacity(0.5),
        actions: const [
           Padding(
             padding: EdgeInsets.all(16.0),
             child: Icon(Icons.circle, color: Colors.green, size: 12),
           )
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.black, Colors.blueGrey.shade900],
          )
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16.0),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('ACTIVE THREAT STREAM', style: TextStyle(color: Colors.cyanAccent, letterSpacing: 2, fontSize: 12)),
                  Icon(Icons.radar, color: Colors.cyanAccent),
                ],
              ),
            ),
            Expanded(
              child: incidentFeed.isEmpty 
                  ? const Center(child: Text("SYSTEM SECURE.\nNO ANOMALIES DETECTED.", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)))
                  : ListView.builder(
                      itemCount: incidentFeed.length,
                      itemBuilder: (context, index) {
                        var incident = incidentFeed[index];
                        return Dismissible(
                          key: Key('${incident['agentId']}_$index'),
                          background: Container(
                            color: Colors.red,
                            alignment: Alignment.centerLeft,
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: const Icon(Icons.shield, color: Colors.white),
                          ),
                          secondaryBackground: Container(
                            color: Colors.green,
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: const Icon(Icons.healing, color: Colors.white),
                          ),
                          onDismissed: (direction) {
                            if (direction == DismissDirection.startToEnd) {
                              executePlaybook(incident['agentId'], 'KILL_AND_CLEAN');
                            } else {
                              executePlaybook(incident['agentId'], 'VSS_RESTORE');
                            }
                          },
                          child: Card(
                            color: Colors.black45,
                            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            shape: RoundedRectangleBorder(side: const BorderSide(color: Colors.redAccent, width: 1), borderRadius: BorderRadius.circular(8)),
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(incident['agentId'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.redAccent)),
                                      Text('Risk Score: ${incident['verdict']['riskScore']}', style: const TextStyle(color: Colors.orange)),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(incident['telemetry']['filename'] ?? '', style: const TextStyle(fontSize: 16)),
                                  const SizedBox(height: 4),
                                  Text(incident['verdict']['reasoning'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 10)),
                                  const SizedBox(height: 16),
                                  const Text("Swipe Right -> ISOLATE\nSwipe Left <- AUTO-HEAL", style: TextStyle(color: Colors.white54, fontSize: 10, fontStyle: FontStyle.italic)),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
