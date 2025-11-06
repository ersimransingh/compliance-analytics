const authRoutes = require('./authRoutes');
const apiRoutes = require('./apiRoutes');
const authenticate = require('../middleware/authMiddleware');

const registerRoutes = (app) => {
  app.use('/auth', authRoutes);
  app.use('/api', authenticate, apiRoutes);
};

module.exports = registerRoutes;
