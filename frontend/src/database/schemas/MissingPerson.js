import mongoose from 'mongoose';

const tipSchema = new mongoose.Schema({
  reporterName: { type: String, default: 'Anonymous Volunteer' },
  reporterContact: { type: String, default: '' },
  comment: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    addressName: { type: String, default: '' }
  },
  photoUrl: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

const missingPersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Non-Binary', 'Other'], default: 'Other' },
  lastSeenLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    addressName: { type: String, default: 'Downtown Sector 4' }
  },
  lastSeenDate: { type: Date, default: Date.now },
  photoUrl: { type: String, default: '' },
  clothingDescription: { type: String, default: 'Blue waterproof jacket, dark jeans, carrying red backpack' },
  medicalConditions: { type: String, default: 'None reported' },
  reporterName: { type: String, default: 'Family Member' },
  reporterContact: { type: String, required: true },
  status: {
    type: String,
    enum: ['missing', 'spotted', 'sheltered', 'reunited'],
    default: 'missing'
  },
  shelterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', default: null },
  tips: [tipSchema]
}, { timestamps: true });

export const MissingPerson = mongoose.model('MissingPerson', missingPersonSchema);
