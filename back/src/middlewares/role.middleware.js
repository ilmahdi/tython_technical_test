import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('User authentication required'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new ForbiddenError(`Action restricted to: ${allowedRoles.join(', ')}`)
    );
  }

  next();
};
