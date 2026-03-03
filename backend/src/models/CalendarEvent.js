import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    startIso: { type: String, required: true }, // YYYY-MM-DD
    endIso: { type: String, required: true },   // YYYY-MM-DD
  },
  { timestamps: true }
);

calendarEventSchema.index({ startIso: 1, endIso: 1 });

export default mongoose.model('CalendarEvent', calendarEventSchema);
