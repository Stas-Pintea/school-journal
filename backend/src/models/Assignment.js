import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    hours: { type: Number, required: true }
  },
  { timestamps: true }
);

assignmentSchema.index({ teacher: 1, class: 1, subject: 1 }, { unique: true });

export default mongoose.model('Assignment', assignmentSchema);
