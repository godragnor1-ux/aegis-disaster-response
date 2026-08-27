import mongoose from 'mongoose';

const responderSchema = new mongoose.Schema({
  callsign: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['paramedic', 'firefighter', 'swift_water', 'k9_search', 'heavy_extrication', 'drone_pilot'],
    required: true
  },
  phone: { type: String, default: '+1 (555) 911-0000' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['available', 'en_route', 'on_scene', 'busy', 'off_duty'],
    default: 'available'
  },
  activeTaskId: { type: String, default: null },
  vehicleType: { type: String, default: 'Ambulance Unit' },
  equipment: [{ type: String }],
  batteryLevel: { type: Number, default: 95 }
}, { timestamps: true });

export const Responder = mongoose.model('Responder', responderSchema);
