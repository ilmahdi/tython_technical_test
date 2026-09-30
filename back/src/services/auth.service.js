import bcrypt from 'bcryptjs';
import * as userRepo from '../repositories/user.repository.js';
import { UnauthorizedError } from '../utils/errors.js';
import { signToken } from '../utils/jwt.js';

export const login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    },
  };
};

export const getCurrentUser = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new UnauthorizedError('User account not found');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };
};
