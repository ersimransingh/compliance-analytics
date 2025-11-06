const { pool } = require('../config/database');

const TABLE_NAME = 'tbl_GenericAPIDefinition';

const REQUIRED_FIELDS = [
  'ProjectName',
  'ModuleName',
  'FunctionName',
  'ProcedureName',
  'IsDebugEnabled',
  'IsActive',
  'APIDescription',
  'AppServerFilePath',
  'Owner',
  'UpdateBy',
];

const normalizeFlag = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toUpperCase();
  if (!['Y', 'N'].includes(normalized)) {
    throw new Error('Flag values must be either "Y" or "N".');
  }
  return normalized;
};

const validateDefinitionPayload = (payload) => {
  const missingFields = REQUIRED_FIELDS.filter((field) => !payload[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
};

const mapRowToDefinition = (row) => ({
  serialNo: row.SerialNo,
  projectName: row.ProjectName,
  moduleName: row.ModuleName,
  functionName: row.FunctionName,
  procedureName: row.ProcedureName,
  isDebugEnabled: row.IsDebugEnabled,
  isActive: row.IsActive,
  apiDescription: row.APIDescription,
  appServerFilePath: row.AppServerFilePath,
  owner: row.Owner,
  updateBy: row.UpdateBy,
  updateTimestamp: row.UpdateTimeStamp,
});

const createDefinition = async (payload) => {
  validateDefinitionPayload(payload);

  const normalizedPayload = {
    ...payload,
    IsDebugEnabled: normalizeFlag(payload.IsDebugEnabled),
    IsActive: normalizeFlag(payload.IsActive),
  };

  const insertStatement = `
    INSERT INTO ${TABLE_NAME}
      (ProjectName, ModuleName, FunctionName, ProcedureName, IsDebugEnabled, IsActive, APIDescription,
       AppServerFilePath, Owner, UpdateBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    normalizedPayload.ProjectName,
    normalizedPayload.ModuleName,
    normalizedPayload.FunctionName,
    normalizedPayload.ProcedureName,
    normalizedPayload.IsDebugEnabled,
    normalizedPayload.IsActive,
    normalizedPayload.APIDescription,
    normalizedPayload.AppServerFilePath,
    normalizedPayload.Owner,
    normalizedPayload.UpdateBy,
  ];

  const [result] = await pool.execute(insertStatement, values);

  return getDefinitionBySerial(result.insertId);
};

const getDefinitionBySerial = async (serialNo) => {
  const [rows] = await pool.execute(
    `SELECT * FROM ${TABLE_NAME} WHERE SerialNo = ?`,
    [serialNo],
  );

  if (!rows.length) {
    return null;
  }

  return mapRowToDefinition(rows[0]);
};

const findDefinitions = async ({ projectName, moduleName, functionName, onlyActive = false }) => {
  const conditions = [];
  const values = [];

  if (projectName) {
    conditions.push('ProjectName = ?');
    values.push(projectName);
  }

  if (moduleName) {
    conditions.push('ModuleName = ?');
    values.push(moduleName);
  }

  if (functionName) {
    conditions.push('FunctionName = ?');
    values.push(functionName);
  }

  if (onlyActive) {
    conditions.push('IsActive = "Y"');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  console.log("QUERY", `SELECT * FROM ${TABLE_NAME} ${whereClause} ORDER BY SerialNo DESC`, values);
  const [rows] = await pool.query(`SELECT * FROM ${TABLE_NAME} ${whereClause} ORDER BY SerialNo DESC`, values);
  return rows.map(mapRowToDefinition);
};

const getActiveDefinition = async ({ projectName, moduleName, functionName }) => {
  const definitions = await findDefinitions({
    projectName,
    moduleName,
    onlyActive: true,
  });

  if (!definitions.length) {
    return null;
  }

  if (definitions.length > 1) {
    throw new Error('Multiple API definitions found. Please specify a unique FunctionName.');
  }

  return definitions[0];
};

module.exports = {
  createDefinition,
  findDefinitions,
  getActiveDefinition,
};
