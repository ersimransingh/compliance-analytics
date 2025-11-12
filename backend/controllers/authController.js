const config = require('../config/environment');
const { loginUpstream } = require('../services/upstreamAuthService');
const { rememberTokenSession } = require('../services/sessionStore');

const resolveUpstreamToken = (upstreamResponse) =>
  upstreamResponse?.auth_token ||
  upstreamResponse?.message?.auth_token ||
  upstreamResponse?.message?.token ||
  upstreamResponse?.token;

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

    const upstreamToken = resolveUpstreamToken(upstreamResponse);
    if (!upstreamToken) {
      throw new Error('Upstream response did not include an authorization token.');
    }

    rememberTokenSession(upstreamToken, {
      loginId: email,
      loginType: config.upstream.loginType,
    });

    const tokenPayload = {
      project: api.ProjectName || 'Login',
      module: api.ModuleName || 'Login',
    };

    return res.status(200).json({
      success: true,
      token: upstreamToken,
      expiresIn: config.auth.tokenExpiry,
      project: tokenPayload.project,
      module: tokenPayload.module,
      upstreamResponse,
    });
  } catch (error) {
    if ([
      'Request body must contain an api object and data object.',
      'Missing api metadata in request payload.',
      'Missing data payload for authentication.',
      'Both email and password are required.',
      'Upstream response did not include an authorization token.',
    ].includes(error.message)) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

module.exports = {
  login,
};
