const axios = require('axios');
const config = require('../config/environment');
const logger = require('../utils/logger');

const loginUpstream = async (email, password) => {
  try {
    const response = await axios.post(
      config.upstream.loginUrl,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          Origin: 'https://compliancesutra.com',
          Referer: 'https://compliancesutra.com/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
        },
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

module.exports = {
  loginUpstream,
};
