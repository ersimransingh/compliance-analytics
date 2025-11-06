const { verifyToken } = require('../services/tokenService');

const extractToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

const authenticate = (req, res, next) => {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token missing.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authorization token.' });
  }
};

module.exports = authenticate;
