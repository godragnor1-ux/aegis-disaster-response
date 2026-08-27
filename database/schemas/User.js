import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false, // Hidden by default on queries
  },
  role: {
    type: String,
    enum: ['admin', 'rescuer', 'user'],
    default: 'user',
  },
  phone: {
    type: String,
    default: '+1 (555) 000-0000',
  },
  callsign: {
    type: String,
    default: null,
  },
  specialties: [{
    type: String,
    enum: ['swift_water', 'paramedic', 'firefighter', 'k9_search', 'heavy_extrication', 'drone_pilot', 'general', 'reconnaissance'],
  }],
  status: {
    type: String,
    enum: ['available', 'on_duty', 'busy', 'offline'],
    default: 'available',
  },
  assignedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  avatarUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60',
  },
}, { timestamps: true });

// Encrypt password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user-entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
