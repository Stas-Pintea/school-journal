import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'DEPUTY_ADMIN', 'TEACHER'], default: 'TEACHER' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    isActive: { type: Boolean, default: true },
    refreshTokenHash: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);

