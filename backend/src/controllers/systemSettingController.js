import AcademicYearSetting from '../models/AcademicYearSetting.js';

function getDefaultAcademicYears() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const firstSemesterYear = m >= 8 ? y : y - 1;
  return { firstSemesterYear, secondSemesterYear: firstSemesterYear + 1 };
}

export const getAcademicYearSetting = async (_req, res) => {
  const doc = await AcademicYearSetting.findOne({ key: 'academicYear' }).lean();
  if (!doc) {
    return res.json(getDefaultAcademicYears());
  }
  return res.json({
    firstSemesterYear: Number(doc.firstSemesterYear),
    secondSemesterYear: Number(doc.secondSemesterYear),
  });
};

export const upsertAcademicYearSetting = async (req, res) => {
  const firstSemesterYear = Number(req.body?.firstSemesterYear);
  const secondSemesterYear = Number(req.body?.secondSemesterYear);

  if (!Number.isInteger(firstSemesterYear) || !Number.isInteger(secondSemesterYear)) {
    return res.status(400).json({ message: 'firstSemesterYear and secondSemesterYear must be integers' });
  }
  if (secondSemesterYear !== firstSemesterYear + 1) {
    return res.status(400).json({ message: 'secondSemesterYear must equal firstSemesterYear + 1' });
  }

  const doc = await AcademicYearSetting.findOneAndUpdate(
    { key: 'academicYear' },
    { key: 'academicYear', firstSemesterYear, secondSemesterYear },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return res.json({
    firstSemesterYear: Number(doc.firstSemesterYear),
    secondSemesterYear: Number(doc.secondSemesterYear),
  });
};

