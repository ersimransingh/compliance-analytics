const config = require('../config/environment');
const { generateToken } = require('../services/tokenService');
const { loginUpstream } = require('../services/upstreamAuthService');

const validateLoginPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Request body must contain an api object and data object.');
  }

  if (!payload.api || typeof payload.api !== 'object') {
    throw new Error('Missing api metadata in request payload.');
  }

  if (!payload.data || typeof payload.data !== 'object') {
    throw new Error('Missing data payload for authentication.');
  }

  if (!payload.data.email || !payload.data.password) {
    throw new Error('Both email and password are required.');
  }
};

const login = async (req, res, next) => {
  try {
    validateLoginPayload(req.body);

    const { api, data } = req.body;
    const { email, password } = data;

    const upstreamResponse = await loginUpstream(email, password);

    const tokenPayload = {
      email,
      project: api.ProjectName || 'Login',
      module: api.ModuleName || 'Login',
    };

    const token = generateToken(tokenPayload);

    return res.status(200).json({
      success: true,
      token,
      expiresIn: config.auth.tokenExpiry,
      project: tokenPayload.project,
      module: tokenPayload.module,
      upstreamResponse,
    });
  } catch (error) {
    if (['Request body must contain an api object and data object.', 'Missing api metadata in request payload.', 'Missing data payload for authentication.', 'Both email and password are required.'].includes(error.message)) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

module.exports = {
  login,
};
