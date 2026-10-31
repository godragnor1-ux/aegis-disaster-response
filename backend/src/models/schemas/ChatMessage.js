import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  channel: {
    type: String,
    enum: ['citizen_public', 'responder_tactical', 'command_ops', 'walkie_talkie', 'voice_sos', 'mesh_relay'],
    default: 'citizen_public'
  },
  senderName: { type: String, required: true },
  senderRole: {
    type: String,
    enum: ['citizen', 'responder', 'commander', 'dispatcher', 'system', 'admin'],
    default: 'citizen'
  },
  message: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  audioBase64: { type: String, default: '' },
  audioDurationSeconds: { type: Number, default: 0 },
  codec: { type: String, default: 'audio/webm;codecs=opus' },
  payloadSizeBytes: { type: Number, default: 0 },
  frequencyMHz: { type: String, default: '145.500' },
  isEmergencyAlert: { type: Boolean, default: false },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'flash_override'],
    default: 'normal'
  },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
