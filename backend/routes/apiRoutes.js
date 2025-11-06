const express = require('express');
const { createApiDefinition, listApiDefinitions, executeApiDefinition } = require('../controllers/apiController');

const router = express.Router();

router.post('/definitions', createApiDefinition);
router.get('/definitions', listApiDefinitions);

router.post('/execute', executeApiDefinition);
router.get('/execute', executeApiDefinition);

module.exports = router;
