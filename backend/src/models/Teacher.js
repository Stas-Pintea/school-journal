import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    photo: { type: String, default: '' },
    fullName: { type: String, required: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    birthDate: Date,
    status: { type: String, default: 'Active' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }]
  },
  { timestamps: true }
);

teacherSchema.index({ user: 1 }, { unique: true, sparse: true });

export default mongoose.model('Teacher', teacherSchema);

