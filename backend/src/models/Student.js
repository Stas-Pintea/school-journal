import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  type: String,
  workplace: String
});

const studentSchema = new mongoose.Schema(
  {
    photo: { type: String, default: '' },

    fullName: { type: String, required: true },

    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },

    birthDate: Date,
    status: { type: String, default: 'Активный' },

    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },

    parents: [parentSchema]
  },
  { timestamps: true }
);

export default mongoose.model('Student', studentSchema);
