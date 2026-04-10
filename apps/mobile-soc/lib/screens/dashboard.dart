import 'package:flutter/material.dart';
import '../services/socket_service.dart';
import '../models/threat_event.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    socketService.initSocket();
  }

  @override
  void dispose() {
    socketService.dispose();
    super.dispose();
  }

  Color _getVerdictColor(String verdict) {
    switch (verdict) {
      case 'BLOCK':
        return Colors.redAccent;
      case 'SANDBOX':
        return Colors.orangeAccent;
      case 'WARN':
        return Colors.yellowAccent;
      case 'ALLOW':
      default:
        return Colors.greenAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A), // Deep dark hacker aesthetic
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.security, color: Colors.cyanAccent),
            const SizedBox(width: 10),
            Text(
              'SentinelAI Mobile',
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2.0),
            ),
          ],
        ),
        backgroundColor: Colors.black,
        elevation: 0,
        actions: [
          ValueListenableBuilder<bool>(
            valueListenable: socketService.isConnected,
            builder: (context, isConnected, child) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  children: [
                    Text(
                      isConnected ? 'CONNECTED' : 'OFFLINE',
                      style: TextStyle(
                        color: isConnected ? Colors.greenAccent : Colors.redAccent,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isConnected ? Colors.greenAccent : Colors.redAccent,
                        boxShadow: [
                          BoxShadow(
                            color: (isConnected ? Colors.greenAccent : Colors.redAccent).withOpacity(0.5),
                            spreadRadius: 2,
                            blurRadius: 5,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: ValueListenableBuilder<List<ThreatEvent>>(
        valueListenable: socketService.threatEvents,
        builder: (context, events, child) {
          if (events.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shield_outlined, size: 80, color: Colors.cyan.withOpacity(0.2)),
                  const SizedBox(height: 20),
                  const Text(
                    "Network is Secure",
                    style: TextStyle(color: Colors.grey, fontSize: 18),
                  ),
                  const Text(
                    "Awaiting live endpoint telemetry...",
                    style: TextStyle(color: Colors.white30, fontSize: 12),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: events.length,
            itemBuilder: (context, index) {
              final event = events[index];
              final color = _getVerdictColor(event.decision);

              return Card(
                color: Colors.white.withOpacity(0.02),
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: color.withOpacity(0.3), width: 1),
                  borderRadius: BorderRadius.circular(12),
                ),
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: color.withOpacity(0.5)),
                            ),
                            child: Text(
                              event.decision,
                              style: TextStyle(
                                  color: color,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                  letterSpacing: 1),
                            ),
                          ),
                          Text(
                            "Score: ${event.riskScore}/100",
                            style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        event.filename,
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Agent: ${event.agentId}",
                        style: const TextStyle(color: Colors.white54, fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.black45,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.white.withOpacity(0.05)),
                        ),
                        child: Text(
                          "AI Analysis:\n${event.reasoning}",
                          style: TextStyle(color: Colors.cyan.shade100, fontSize: 12, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
