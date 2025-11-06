const jwt = require('jsonwebtoken');
const config = require('../config/environment');

const generateToken = (payload) =>
  jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.tokenExpiry,
    issuer: 'compliance-analytics-backend',
  });

const verifyToken = (token) => jwt.verify(token, config.auth.jwtSecret, { issuer: 'compliance-analytics-backend' });

module.exports = {
  generateToken,
  verifyToken,
};
