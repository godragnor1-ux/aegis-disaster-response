/**
 * Ad-Hoc P2P Mesh Network Packet Relaying Simulator
 */

export const simulateMeshPacketRelay = ({ payload, originNodeId = 'NODE-VICTIM-01', targetGatewayId = 'GATEWAY-BASE-HQ' }) => {
  const intermediateNodes = [
    { id: 'NODE-RELAY-ALPHA', lat: 28.6180, lng: 77.2120, batteryPct: 78, signalDbm: -68 },
    { id: 'NODE-RELAY-BRAVO', lat: 28.6230, lng: 77.2180, batteryPct: 64, signalDbm: -74 },
    { id: 'NODE-RELAY-CHARLIE', lat: 28.6310, lng: 77.2250, batteryPct: 91, signalDbm: -59 }
  ];

  const hops = [
    {
      hopIndex: 1,
      from: originNodeId,
      to: intermediateNodes[0].id,
      latencyMs: 42,
      protocol: 'BLE_5_LONG_RANGE',
      rssi: -68,
      status: 'ACK_CONFIRMED'
    },
    {
      hopIndex: 2,
      from: intermediateNodes[0].id,
      to: intermediateNodes[1].id,
      latencyMs: 78,
      protocol: 'LORA_915MHZ_MESH',
      rssi: -74,
      status: 'ACK_CONFIRMED'
    },
    {
      hopIndex: 3,
      from: intermediateNodes[1].id,
      to: intermediateNodes[2].id,
      latencyMs: 51,
      protocol: 'P2P_WEBRTC_RADIO',
      rssi: -59,
      status: 'ACK_CONFIRMED'
    },
    {
      hopIndex: 4,
      from: intermediateNodes[2].id,
      to: targetGatewayId,
      latencyMs: 33,
      protocol: 'CELLULAR_SATELLITE_UPLINK',
      rssi: -52,
      status: 'DELIVERED_TO_COMMAND_CENTER'
    }
  ];

  return {
    success: true,
    packetId: `PKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    originNodeId,
    targetGatewayId,
    totalHops: hops.length,
    totalLatencyMs: hops.reduce((sum, h) => sum + h.latencyMs, 0),
    hops,
    payloadDelivered: payload,
    receivedAt: new Date().toISOString()
  };
};
