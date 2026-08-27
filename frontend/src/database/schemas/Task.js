import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['flood_rescue', 'medical_evacuation', 'fire_containment', 'debris_extrication', 'reconnaissance', 'supply_drop', 'general_support'],
    default: 'general_support',
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'high',
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: 'Sector Zone' },
  },
  sosBeaconId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SOSBeacon',
    default: null,
  },
  incidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    default: null,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedResponderCallsign: {
    type: String,
    default: null,
  },
  requiredSkills: [{
    type: String,
  }],
  survivorsCount: {
    type: Number,
    default: 1,
  },
  hazardsReported: [{
    type: String,
  }],
  notes: [{
    author: String,
    text: String,
    timestamp: { type: Date, default: Date.now },
  }],
  assignedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export const Task = mongoose.model('Task', taskSchema);
