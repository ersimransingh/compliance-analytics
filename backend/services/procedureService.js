const { callStoredProcedure } = require('../config/database');
const logger = require('../utils/logger');

const normalizePayload = (payload) => {
  if (!payload) {
    return { keys: [], values: [] };
  }

  if (Array.isArray(payload)) {
    return {
      keys: payload.map((_, index) => index.toString()),
      values: payload,
    };
  }

  if (typeof payload === 'object') {
    return {
      keys: ['payload'],
      values: [payload],
    };
  }

  throw new Error('Invalid data payload. Expected an object or array.');
};

const normalizeResultSets = (rows) => {
  if (!Array.isArray(rows)) {
    return rows;
  }

  const datasets = rows.filter((set) => Array.isArray(set));
  if (!datasets.length) {
    return rows;
  }

  if (datasets.length === 1) {
    return datasets[0];
  }

  return datasets;
};

const executeProcedure = async (apiDefinition, rawPayload) => {
  const { values } = normalizePayload(rawPayload);
  const sanitizedValues = values.map((value) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date || Buffer.isBuffer(value)) {
      return value;
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return value;
  });
  const debugEnabled = apiDefinition.isDebugEnabled === 'Y';
  const payloadMeta = {
    procedure: apiDefinition.procedureName,
    parameterCount: sanitizedValues.length,
    sanitizedValues,
  };
  logger.info('Prepared stored procedure payload.', payloadMeta);
  try {
    const rows = await callStoredProcedure(apiDefinition.procedureName, sanitizedValues, debugEnabled);

    return normalizeResultSets(rows);
  } catch (error) {
    logger.error('Stored procedure execution failed.', {
      ...payloadMeta,
      error: error.message,
    });
    error.details = {
      ...(error.details || {}),
      procedure: apiDefinition.procedureName,
      parameters: sanitizedValues,
    };
    throw error;
  }
};

module.exports = {
  executeProcedure,
};
