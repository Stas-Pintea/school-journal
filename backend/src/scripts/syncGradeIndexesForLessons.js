import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MONGO_URI is required');
  process.exit(1);
}

try {
  await mongoose.connect(uri);
  const col = mongoose.connection.collection('grades');
  const indexes = await col.indexes();

  const oldName = indexes.find((idx) => {
    const k = idx.key || {};
    return (
      k.student === 1 &&
      k.class === 1 &&
      k.subject === 1 &&
      k.kind === 1 &&
      k.date === 1 &&
      k.lessonNo === undefined
    );
  })?.name;

  if (oldName) {
    await col.dropIndex(oldName);
    console.log(`Dropped old daily unique index: ${oldName}`);
  } else {
    console.log('Old daily unique index not found (nothing to drop)');
  }

  await col.createIndex(
    { student: 1, class: 1, subject: 1, kind: 1, date: 1, lessonNo: 1 },
    {
      unique: true,
      partialFilterExpression: {
        date: { $type: 'string' },
        kind: { $in: ['regular', 'absence'] },
      },
      name: 'uniq_daily_with_lesson_no',
    }
  );

  await col.createIndex(
    { student: 1, class: 1, subject: 1, kind: 1, period: 1 },
    { unique: true, partialFilterExpression: { period: { $type: 'string' } } }
  );

  await col.createIndex(
    { student: 1, class: 1, subject: 1, kind: 1, task: 1 },
    { unique: true, partialFilterExpression: { task: { $type: 'objectId' } } }
  );

  console.log('Grade indexes synced successfully');
  process.exit(0);
} catch (err) {
  console.error('Failed to sync grade indexes:', err.message);
  process.exit(1);
}
