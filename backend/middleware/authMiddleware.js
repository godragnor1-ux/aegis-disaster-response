import jwt from 'jsonwebtoken';
import { User } from '../../database/schemas/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aegis_pulse_super_secret_jwt_key_2026';

/**
 * Generate signed JWT token
 */
export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Protect routes - require valid JWT
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'User account no longer exists' });
      }

      next();
    } catch (error) {
      console.error('JWT Auth Verification Error:', error.message);
      return res.status(401).json({ success: false, error: 'Not authorized, invalid or expired token' });
    }
  } else {
    return res.status(401).json({ success: false, error: 'Not authorized, no bearer token provided' });
  }
};

/**
 * Role-Based Access Control Middleware
 * @param  {...string} roles - allowed roles ('admin', 'rescuer', 'user')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User must be authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this resource. Required: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};
