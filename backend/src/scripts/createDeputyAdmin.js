import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const username = process.env.DEPUTY_ADMIN_USERNAME;
  const email = process.env.DEPUTY_ADMIN_EMAIL;
  const password = process.env.DEPUTY_ADMIN_PASSWORD;

  if (!username || !email || !password) {
    console.error('Set DEPUTY_ADMIN_USERNAME, DEPUTY_ADMIN_EMAIL and DEPUTY_ADMIN_PASSWORD in environment');
    process.exit(1);
  }

  const exists = await User.findOne({ $or: [{ username }, { email }] });
  if (exists) {
    console.log('Deputy admin already exists');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ username, email, passwordHash, role: 'DEPUTY_ADMIN' });

  console.log('Deputy admin created:', { username, email });
  process.exit(0);
})();
