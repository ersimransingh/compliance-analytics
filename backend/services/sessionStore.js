const tokenSessions = new Map();

const rememberTokenSession = (token, session = {}) => {
  if (!token) {
    return;
  }

  tokenSessions.set(token, {
    ...session,
    storedAt: Date.now(),
  });
};

const getTokenSession = (token) => tokenSessions.get(token);

const clearTokenSession = (token) => tokenSessions.delete(token);

module.exports = {
  rememberTokenSession,
  getTokenSession,
  clearTokenSession,
};
