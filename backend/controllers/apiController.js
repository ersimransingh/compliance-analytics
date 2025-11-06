const { createDefinition, findDefinitions, getActiveDefinition } = require('../services/apiDefinitionService');
const { executeProcedure } = require('../services/procedureService');

const extractApiMetadata = (req) => {
  if (req.method === 'GET') {
    const projectName = req.query.projectName || req.query.ProjectName;
    const moduleName = req.query.moduleName || req.query.ModuleName;
    const functionName = req.query.functionName || req.query.FunctionName;

    return {
      api: {
        ProjectName: projectName,
        ModuleName: moduleName,
        FunctionName: functionName,
      },
      data: undefined,
    };
  }

  if (!req.body || typeof req.body !== 'object') {
    throw new Error('Request body must contain api metadata.');
  }

  if (!req.body.api || typeof req.body.api !== 'object') {
    throw new Error('Missing api metadata in request body.');
  }

  return {
    api: req.body.api,
    data: req.body.data,
  };
};

const ensureApiKeys = (api) => {
  if (!api.ProjectName || !api.ModuleName) {
    throw new Error('Both ProjectName and ModuleName are required in the api object.');
  }
};

const createApiDefinition = async (req, res, next) => {
  try {
    const created = await createDefinition(req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error.message?.startsWith('Missing required fields') || error.message?.includes('Flag values')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'API definition already exists.' });
    }
    return next(error);
  }
};

const listApiDefinitions = async (req, res, next) => {
  try {
    const definitions = await findDefinitions({
      projectName: req.query.projectName,
      moduleName: req.query.moduleName,
      functionName: req.query.functionName,
      onlyActive: req.query.onlyActive === 'true' || req.query.onlyActive === '1',
    });

    return res.status(200).json({ success: true, data: definitions });
  } catch (error) {
    return next(error);
  }
};

const executeApiDefinition = async (req, res, next) => {
  try {
    const { api, data } = extractApiMetadata(req);
    ensureApiKeys(api);

    const definition = await getActiveDefinition({
      projectName: api.ProjectName,
      moduleName: api.ModuleName,
      functionName: api.FunctionName,
    });

    if (!definition) {
      return res.status(404).json({ success: false, message: 'Active API definition not found.' });
    }

    const result = await executeProcedure(definition, data);

    return res.status(200).json({
      success: true,
      metadata: {
        projectName: definition.projectName,
        moduleName: definition.moduleName,
        functionName: definition.functionName,
        procedureName: definition.procedureName,
      },
      data: result,
    });
  } catch (error) {
    if ([
      'Request body must contain api metadata.',
      'Missing api metadata in request body.',
      'Both ProjectName and ModuleName are required in the api object.',
      'Invalid data payload. Expected an object or array.',
    ].includes(error.message)) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (error.message === 'Multiple API definitions found. Please specify a unique FunctionName.') {
      return res.status(409).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

module.exports = {
  createApiDefinition,
  listApiDefinitions,
  executeApiDefinition,
};
