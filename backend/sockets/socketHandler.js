import { SOSBeacon } from '../../database/schemas/SOSBeacon.js';
import { Responder } from '../../database/schemas/Responder.js';
import { ChatMessage } from '../../database/schemas/ChatMessage.js';
import { autoAssignResponder } from '../../services/autoDispatchService.js';
import { simulateMeshPacketRelay } from '../../services/meshSimulatorService.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ Socket client connected: ${socket.id}`);

    socket.on('channel:join', (channelName) => {
      socket.join(channelName);
      console.log(`📡 Socket ${socket.id} joined channel: ${channelName}`);
    });

    socket.on('channel:leave', (channelName) => {
      socket.leave(channelName);
    });

    // 1. SOS Beacon Distress Trigger
    socket.on('sos:trigger', async (sosPayload) => {
      try {
        const sosId = sosPayload.sosId || `SOS-${Date.now().toString().slice(-6)}`;
        const newBeacon = new SOSBeacon({
          ...sosPayload,
          sosId,
          status: 'pending'
        });
        await newBeacon.save();

        io.emit('sos:new_distress', newBeacon);

        const dispatchResult = await autoAssignResponder(newBeacon);
        if (dispatchResult.assigned) {
          io.emit('dispatch:assigned', dispatchResult);
          io.emit('sos:updated', await SOSBeacon.findById(newBeacon._id));
          io.emit('responder:status_changed', dispatchResult.responder);
        }
      } catch (error) {
        console.error('Socket SOS Error:', error);
      }
    });

    // 2. Voice SOS Distress Audio Stream
    socket.on('voice_sos:send', async (voiceData) => {
      try {
        const payloadSize = voiceData.audioBase64 ? Math.round((voiceData.audioBase64.length * 3) / 4) : 0;
        const msg = new ChatMessage({
          channel: 'voice_sos',
          senderName: voiceData.senderName || 'Voice SOS Victim',
          senderRole: 'citizen',
          message: voiceData.transcription || '🚨 VOICE DISTRESS BEACON RECORDED',
          audioBase64: voiceData.audioBase64,
          audioDurationSeconds: voiceData.audioDurationSeconds || 5,
          payloadSizeBytes: payloadSize,
          isEmergencyAlert: true,
          priority: 'flash_override'
        });
        await msg.save();

        // Broadcast to command and responders with high priority
        io.emit('voice_sos:alert', {
          ...voiceData,
          messageId: msg._id,
          payloadSizeBytes: payloadSize,
          timestamp: new Date().toISOString()
        });

        io.to('command_ops').emit('chat:new_message', msg);
        io.to('responder_tactical').emit('chat:new_message', msg);
      } catch (error) {
        console.error('Voice SOS Error:', error);
      }
    });

    // 3. Walkie-Talkie Push-to-Talk (PTT) Burst
    socket.on('radio:voice_burst', async (pttData) => {
      try {
        const payloadSize = pttData.audioBase64 ? Math.round((pttData.audioBase64.length * 3) / 4) : 0;

        // Save radio log
        const radioMsg = new ChatMessage({
          channel: 'walkie_talkie',
          senderName: pttData.callsign || 'Radio Unit',
          senderRole: pttData.role || 'responder',
          message: pttData.transcript || `📻 Radio Burst on ${pttData.frequencyMHz || '145.500'} MHz`,
          audioBase64: pttData.audioBase64,
          frequencyMHz: pttData.frequencyMHz || '145.500',
          audioDurationSeconds: pttData.audioDurationSeconds || 3,
          payloadSizeBytes: payloadSize,
          priority: 'urgent'
        });
        await radioMsg.save();

        // Broadcast voice burst across the radio channel
        io.emit('radio:incoming_burst', {
          messageId: radioMsg._id,
          callsign: pttData.callsign || 'Radio Unit',
          role: pttData.role || 'responder',
          frequencyMHz: pttData.frequencyMHz || '145.500',
          audioBase64: pttData.audioBase64,
          audioDurationSeconds: pttData.audioDurationSeconds || 3,
          payloadSizeBytes: payloadSize,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Walkie Talkie PTT Error:', error);
      }
    });

    // 4. Real-Time Chat Message (Low Bandwidth Optimized)
    socket.on('chat:send_message', async (chatData) => {
      try {
        const payloadSize = Buffer.byteLength(chatData.message || '', 'utf8');
        const message = new ChatMessage({
          ...chatData,
          payloadSizeBytes: payloadSize
        });
        await message.save();

        io.emit('chat:new_message', message);
      } catch (error) {
        console.error('Chat Socket Error:', error);
      }
    });

    // 5. Admin Civil Defense Broadcast Alert (Admin -> Users)
    socket.on('alert:trigger_broadcast', async (alertPayload) => {
      try {
        const alertData = {
          ...alertPayload,
          broadcastId: `ALERT-${Date.now()}`,
          sender: alertPayload.sender || 'Civil Defense Commander',
          title: alertPayload.title || 'EMERGENCY EVACUATION DIRECTIVE',
          message: alertPayload.message || 'Immediate evacuation order in effect for low-lying sectors.',
          threatLevel: alertPayload.threatLevel || 'CODE_RED',
          timestamp: new Date().toISOString(),
          sirenSound: true
        };

        // Save as flash message
        const broadcastMsg = new ChatMessage({
          channel: 'command_ops',
          senderName: alertData.sender,
          senderRole: 'commander',
          message: `📢 [BROADCAST] ${alertData.title}: ${alertData.message}`,
          isEmergencyAlert: true,
          priority: 'flash_override'
        });
        await broadcastMsg.save();

        io.emit('alert:emergency_broadcast', alertData);
      } catch (error) {
        console.error('Broadcast Socket Error:', error);
      }
    });

    // 6. Responder Telemetry Stream
    socket.on('responder:telemetry', async ({ responderId, lat, lng, status, speedKmh }) => {
      try {
        const responder = await Responder.findByIdAndUpdate(
          responderId,
          {
            location: { lat, lng },
            ...(status && { status })
          },
          { new: true }
        );
        if (responder) {
          io.emit('responder:position_update', {
            responderId: responder._id,
            callsign: responder.callsign,
            location: responder.location,
            status: responder.status,
            speedKmh: speedKmh || 32
          });
        }
      } catch (error) {
        console.error('Responder Telemetry Error:', error);
      }
    });

    // 7. Mesh Packet Relay
    socket.on('mesh:send_packet', (data) => {
      const relayResult = simulateMeshPacketRelay(data);
      io.emit('mesh:packet_relayed', relayResult);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket client disconnected: ${socket.id}`);
    });
  });
};
