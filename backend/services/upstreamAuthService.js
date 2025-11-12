const axios = require('axios');
const config = require('../config/environment');
const logger = require('../utils/logger');

const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/plain, */*',
  Origin: 'https://compliancesutra.com',
  Referer: 'https://compliancesutra.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
};

const loginUpstream = async (email, password) => {
  try {
    const response = await axios.post(
      config.upstream.loginUrl,
      { email, password },
      {
        headers: defaultHeaders,
        timeout: 10000,
      },
    );

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data || error.message;
    logger.warn('Upstream login failed.', { status, message });

    const upstreamError = new Error('Upstream authentication failed.');
    upstreamError.status = status || 502;
    upstreamError.details = message;
    throw upstreamError;
  }
};

const verifyUpstreamToken = async ({ token, loginId, loginType }) => {
  if (!token) {
    const tokenError = new Error('Authorization token missing.');
    tokenError.status = 401;
    throw tokenError;
  }

  const payload =
    loginId && loginType
      ? {
          loginID: loginId,
          loginty: loginType,
        }
      : {};

  try {
    const response = await axios.post(
      config.upstream.verifyUrl,
      payload,
      {
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      },
    );

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data || error.message;
    logger.warn('Upstream token verification failed.', { status, message });

    const upstreamError = new Error('Upstream token verification failed.');
    upstreamError.status = status || 401;
    upstreamError.details = message;
    throw upstreamError;
  }
};

module.exports = {
  loginUpstream,
  verifyUpstreamToken,
};
