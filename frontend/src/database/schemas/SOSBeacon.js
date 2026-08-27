import mongoose from 'mongoose';

const sosBeaconSchema = new mongoose.Schema({
  sosId: { type: String, required: true, unique: true },
  userName: { type: String, default: 'Citizen In Distress' },
  userPhone: { type: String, default: 'Unknown' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number, default: 5 },
    altitude: { type: Number, default: 0 }
  },
  batteryLevel: { type: Number, default: 85 },
  urgency: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'critical'
  },
  triageColor: {
    type: String,
    enum: ['red', 'yellow', 'green', 'black'],
    default: 'red'
  },
  emergencyType: {
    type: String,
    enum: ['trapped', 'medical', 'flood_rising', 'fire_smoke', 'food_water', 'elderly_infant'],
    default: 'trapped'
  },
  peopleCount: { type: Number, default: 1 },
  frontCameraImage: { type: String, default: '' },
  backCameraImage: { type: String, default: '' },
  audioVoiceUrl: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'en_route', 'on_scene', 'resolved'],
    default: 'pending'
  },
  assignedResponderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Responder', default: null },
  assignedResponderName: { type: String, default: null },
  notes: { type: String, default: '' },
  meshRelayed: { type: Boolean, default: false },
  meshHops: { type: Number, default: 0 },
  isOfflineSynced: { type: Boolean, default: false },
  smsFallbackTriggered: { type: Boolean, default: false }
}, { timestamps: true });

export const SOSBeacon = mongoose.model('SOSBeacon', sosBeaconSchema);
