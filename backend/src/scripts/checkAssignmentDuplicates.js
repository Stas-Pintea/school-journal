import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MONGO_URI is required');
  process.exit(1);
}

const pipeline = [
  {
    $group: {
      _id: {
        teacher: '$teacher',
        class: '$class',
        subject: '$subject',
      },
      count: { $sum: 1 },
      ids: { $push: '$_id' },
    },
  },
  { $match: { count: { $gt: 1 } } },
  { $sort: { count: -1 } },
];

try {
  await mongoose.connect(uri);
  const duplicates = await mongoose.connection
    .collection('assignments')
    .aggregate(pipeline)
    .toArray();

  if (!duplicates.length) {
    console.log('No duplicate assignments found');
    process.exit(0);
  }

  console.log(`Found ${duplicates.length} duplicate assignment groups:`);
  for (const d of duplicates) {
    console.log(
      JSON.stringify(
        {
          teacher: String(d._id.teacher),
          class: String(d._id.class),
          subject: String(d._id.subject),
          count: d.count,
          ids: d.ids.map((x) => String(x)),
        },
        null,
        2
      )
    );
  }

  process.exit(2);
} catch (err) {
  console.error('Failed to check duplicates:', err.message);
  process.exit(1);
}

