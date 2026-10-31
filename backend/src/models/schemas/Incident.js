import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['flood', 'fire', 'earthquake', 'storm', 'collapse', 'chemical', 'medical_emergency'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: 'Disaster Grid Area' }
  },
  radiusMeters: { type: Number, default: 800 },
  dangerPolygon: {
    type: [[Number]],
    default: []
  },
  hazardMetrics: {
    waterDepthMeters: { type: Number, default: 0 },
    windSpeedKmh: { type: Number, default: 0 },
    temperatureCelsius: { type: Number, default: 0 },
    structuralDamageIndex: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['active', 'contained', 'evacuating', 'resolved'],
    default: 'active'
  },
  affectedCount: { type: Number, default: 0 },
  description: { type: String, default: '' },
  reportedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Incident = mongoose.model('Incident', incidentSchema);
