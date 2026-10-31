import mongoose from 'mongoose';

const shelterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['evacuation_center', 'field_hospital', 'supply_depot', 'staging_base'],
    default: 'evacuation_center'
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: 'Safe Zone Area' }
  },
  capacity: { type: Number, required: true, default: 500 },
  occupied: { type: Number, default: 120 },
  supplies: {
    waterLiters: { type: Number, default: 10000 },
    foodMREs: { type: Number, default: 4500 },
    powerGenerators: { type: Number, default: 4 },
    medicalBays: { type: Number, default: 20 },
    blankets: { type: Number, default: 600 }
  },
  amenities: [{ type: String }],
  contactPhone: { type: String, default: '+1 (555) 347-SAFE' },
  status: {
    type: String,
    enum: ['open', 'full', 'evacuating', 'closed'],
    default: 'open'
  }
}, { timestamps: true });

export const Shelter = mongoose.model('Shelter', shelterSchema);
