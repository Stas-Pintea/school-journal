import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    period: { type: String, required: true },          // '2025-2026'
    semester: { type: Number, enum: [1, 2], required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    dateIso: { type: String, required: true }          // 'YYYY-MM-DD'
  },
  { timestamps: true }
);

taskSchema.index({ class: 1, subject: 1, period: 1, dateIso: 1 });

export default mongoose.model('Task', taskSchema);
