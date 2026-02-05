import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },

    // regular | absence | task | exam | semester1 | semester2 | year
    kind: {
      type: String,
      enum: ['regular', 'absence', 'task', 'exam', 'semester1', 'semester2', 'year'],
      required: true
    },

    // Для обычных/пропусков (день)
    date: { type: String, default: null }, // 'YYYY-MM-DD'

    // Для итоговых (exam/semester/year) — учебный период
    period: { type: String, default: null }, // например '2025-2026'

    // Для task-оценок — ссылка на задачу
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },

    // value:
    // - absence: 'a' | 'm'
    // - task: 1..10 (Number) или 'm'
    // - exam/semester/year/regular: 1..10 (Number)
    value: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

// ✅ Уникальность для дневных (date)
gradeSchema.index(
  { student: 1, class: 1, subject: 1, kind: 1, date: 1 },
  { unique: true, partialFilterExpression: { date: { $type: 'string' } } }
);

// ✅ Уникальность для итоговых (period)
gradeSchema.index(
  { student: 1, class: 1, subject: 1, kind: 1, period: 1 },
  { unique: true, partialFilterExpression: { period: { $type: 'string' } } }
);

// ✅ Уникальность для задач (task)
gradeSchema.index(
  { student: 1, class: 1, subject: 1, kind: 1, task: 1 },
  { unique: true, partialFilterExpression: { task: { $type: 'objectId' } } }
);

export default mongoose.model('Grade', gradeSchema);
