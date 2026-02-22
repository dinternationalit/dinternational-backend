const jwt = require('jsonwebtoken');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      
      // Add user info to request object
      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Invalid token.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Authorize based on roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. User not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Optional auth - add user if token is valid, but don't require it
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        req.user = {
          userId: decoded.userId,
          role: decoded.role
        };
      } catch (error) {
        // Invalid token, but that's okay for optional auth
        req.user = null;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};
