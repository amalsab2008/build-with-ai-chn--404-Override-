class ThreatEvent {
  final String filename;
  final String fileHash;
  final double entropy;
  final String timestamp;
  final String decision;
  final int riskScore;
  final String reasoning;
  final String agentId;

  ThreatEvent({
    required this.filename,
    required this.fileHash,
    required this.entropy,
    required this.timestamp,
    required this.decision,
    required this.riskScore,
    required this.reasoning,
    required this.agentId,
  });

  factory ThreatEvent.fromJson(Map<String, dynamic> json) {
    return ThreatEvent(
      filename: json['telemetry']['filename'] ?? 'Unknown',
      fileHash: json['telemetry']['fileHash'] ?? '',
      entropy: (json['telemetry']['entropy'] ?? 0).toDouble(),
      timestamp: json['telemetry']['timestamp'] ?? DateTime.now().toIso8601String(),
      decision: json['verdict']['decision'] ?? 'UNKNOWN',
      riskScore: json['verdict']['riskScore'] ?? 0,
      reasoning: json['verdict']['reasoning'] ?? '',
      agentId: json['agentId'] ?? 'Unknown',
    );
  }
}
