import mongoose from 'mongoose';

const academicYearSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'academicYear' },
    firstSemesterYear: { type: Number, required: true },
    secondSemesterYear: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('AcademicYearSetting', academicYearSettingSchema);

