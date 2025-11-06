const { callStoredProcedure } = require('../config/database');
const logger = require('../utils/logger');

const normalizeDataPayload = (data) => {
  if (!data) {
    return { keys: [], values: [] };
  }

  if (Array.isArray(data)) {
    return {
      keys: data.map((_, index) => index.toString()),
      values: data,
    };
  }

  if (typeof data === 'object') {
    return {
      keys: ['payload'],
      values: [data],
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

const executeProcedure = async (apiDefinition, dataPayload) => {
  const { values } = normalizeDataPayload(dataPayload);
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
  logger.info('Prepared stored procedure payload.', {
    procedure: apiDefinition.procedureName,
    parameterCount: sanitizedValues.length,
    sanitizedValues,
  });
  const rows = await callStoredProcedure(apiDefinition.procedureName, sanitizedValues, debugEnabled);

  return normalizeResultSets(rows);
};

module.exports = {
  executeProcedure,
};
