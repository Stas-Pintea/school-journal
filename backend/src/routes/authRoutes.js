import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';

import User from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyRefresh } from '../utils/tokens.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

function toAuthUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    teacherId: user.teacher || null,
  };
}

function setRefreshCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refresh_token', token, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7) * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

// POST /api/auth/login
router.post(
  '/login',
  body('usernameOrEmail').isString().notEmpty(),
  body('password').isString().isLength({ min: 6 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { usernameOrEmail, password } = req.body;

    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: String(usernameOrEmail).toLowerCase() },
      ],
    });

    if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // сохраняем хэш refresh токена (чтобы можно было отзывать)
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      user: toAuthUser(user),
    });
  })
);

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  try {
    const payload = verifyRefresh(token);
    const user = await User.findById(payload.sub);

    if (!user || !user.refreshTokenHash) return res.status(401).json({ message: 'Refresh denied' });

    const ok = await bcrypt.compare(token, user.refreshTokenHash);
    if (!ok) return res.status(401).json({ message: 'Refresh denied' });

    const accessToken = signAccessToken(user);
    return res.json({
      accessToken,
      user: toAuthUser(user),
    });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}));

// POST /api/auth/logout
router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh_token;
  const isProduction = process.env.NODE_ENV === 'production';

  // чистим cookie
  res.clearCookie('refresh_token', {
    path: '/api/auth',
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  });

  if (token) {
    try {
      const payload = verifyRefresh(token);
      await User.findByIdAndUpdate(payload.sub, { refreshTokenHash: null });
    } catch {
      // ignore
    }
  }

  res.json({ ok: true });
}));

export default router;
