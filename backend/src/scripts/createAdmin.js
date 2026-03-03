import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !password) {
    console.error('Set ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD in environment');
    process.exit(1);
  }

  const exists = await User.findOne({ $or: [{ username }, { email }] });
  if (exists) {
    console.log('Admin already exists');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ username, email, passwordHash, role: 'ADMIN' });

  console.log('Admin created:', { username, email });
  process.exit(0);
})();
