const swaggerJsdoc = require('swagger-jsdoc');
const definition = require('./swaggerDefinition');

const options = {
  definition,
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
