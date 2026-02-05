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

export default mongoose.model('Assignment', assignmentSchema);
