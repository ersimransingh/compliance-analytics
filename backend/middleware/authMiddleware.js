const config = require('../config/environment');
const { verifyUpstreamToken } = require('../services/upstreamAuthService');
const { getTokenSession } = require('../services/sessionStore');

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

const resolveLoginContext = (req, token) => {
  const session = getTokenSession(token);
  const fallbackLoginId = req.headers['x-login-id'] || req.query.loginID || req.body?.loginID;
  const fallbackLoginType = req.headers['x-login-type'] || config.upstream.loginType;

  return {
    loginId: session?.loginId || fallbackLoginId,
    loginType: session?.loginType || fallbackLoginType,
  };
};

const authenticate = async (req, res, next) => {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const { loginId, loginType } = resolveLoginContext(req, token);
    const verification = await verifyUpstreamToken({ token, loginId, loginType });
    req.user = verification;
    return next();
  } catch (error) {
    const status = error.status || 401;
    const message = status === 401 ? 'Invalid or expired authorization token.' : error.message;
    return res.status(status).json({ success: false, message });
  }
};

module.exports = authenticate;
