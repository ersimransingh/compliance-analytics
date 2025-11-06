const mysql = require('mysql2/promise');
const config = require('./environment');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
});

const sanitizeProcedureName = (procedureName) => {
  if (!procedureName || typeof procedureName !== 'string') {
    throw new Error('Invalid procedure name provided.');
  }

  const trimmed = procedureName.trim();
  if (!/^[\w.()]+$/.test(trimmed)) {
    throw new Error('Procedure name contains unsupported characters.');
  }

  if (trimmed.includes('(')) {
    return trimmed;
  }

  return trimmed
    .split('.')
    .map((segment) => `\`${segment}\``)
    .join('.');
};

const buildProcedureCallStatement = (procedureName, parametersCount) => {
  const sanitizedName = sanitizeProcedureName(procedureName);
  if (sanitizedName.includes('(')) {
    return `CALL ${sanitizedName}`;
  }

  if (parametersCount === 0) {
    return `CALL ${sanitizedName}()`;
  }

  const placeholders = new Array(parametersCount).fill('?').join(', ');
  return `CALL ${sanitizedName}(${placeholders})`;
};

const TABLE_CREATORS = [
  {
    name: 'tbl_GenericAPIDefinition',
    statement: `
      CREATE TABLE IF NOT EXISTS tbl_GenericAPIDefinition (
        SerialNo INT NOT NULL AUTO_INCREMENT,
        ProjectName VARCHAR(50) NOT NULL,
        ModuleName VARCHAR(50) NOT NULL,
        FunctionName VARCHAR(50) NOT NULL,
        ProcedureName VARCHAR(1000) NOT NULL,
        IsDebugEnabled VARCHAR(1) NOT NULL,
        IsActive VARCHAR(1) NOT NULL,
        APIDescription VARCHAR(1000) NOT NULL,
        AppServerFilePath VARCHAR(255) NOT NULL,
        Owner VARCHAR(50) NOT NULL,
        UpdateBy VARCHAR(50) NOT NULL,
        UpdateTimeStamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (SerialNo),
        UNIQUE KEY uq_GenericApi (ProjectName, ModuleName, FunctionName)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `,
  },
  {
    name: 'ANALYTICS',
    statement: `
      CREATE TABLE IF NOT EXISTS ANALYTICS (
        Email_ID VARCHAR(191) NOT NULL,
        Screen_Name VARCHAR(191) NOT NULL,
        Screen_Path VARCHAR(191) NOT NULL,
        name VARCHAR(191) NOT NULL,
        params JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (Email_ID, Screen_Name, Screen_Path, name, timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `,
  },
  {
    name: 'API_LOGS',
    statement: `
      CREATE TABLE IF NOT EXISTS API_LOGS (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        base_url VARCHAR(255) NOT NULL,
        headers JSON,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        request_payload JSON,
        response_payload JSON,
        status_code INT,
        response_time INT,
        api_status ENUM('success', 'error') NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `,
  },
];

const ensureTable = async ({ name, statement }) => {
  await pool.query(statement);
  logger.info(`${name} table is ready.`);
};

const ensureRequiredTables = async () => {
  await Promise.all(TABLE_CREATORS.map((table) => ensureTable(table)));
};

const ensureConnection = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    logger.info('Successfully connected to MySQL.', { host: config.db.host, database: config.db.database });
  } finally {
    connection.release();
  }
};

const callStoredProcedure = async (procedureName, parameterValues = [], debugEnabled = false) => {
  const statement = buildProcedureCallStatement(procedureName, parameterValues.length);
  if (debugEnabled) {
    logger.debug(`Executing stored procedure: ${statement}`, { parameterValues });
  }

  const [rows] = await pool.query(statement, parameterValues);
  return rows;
};

module.exports = {
  pool,
  ensureConnection,
  callStoredProcedure,
  ensureRequiredTables,
};
