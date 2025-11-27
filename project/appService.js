const oracledb = require('oracledb');
const fs = require('fs/promises');
const path = require('path');
const loadEnvFile = require('./utils/envUtil');

const envVariables = loadEnvFile('./.env');
const sqlFilePath = path.join(__dirname, 'hiketracker.sql');
let cachedSqlStatements = null;

const tableDefinitions = {
    SafetyHazard: {
        columns: ['SafetyHazardID', 'HazardType'],
        primaryKey: ['SafetyHazardID']
    },
    Preference: {
        columns: ['PreferenceID', 'Distance', 'Duration', 'Elevation', 'Difficulty'],
        primaryKey: ['PreferenceID']
    },
    AppUser: {
        columns: ['UserID', 'Name', 'PreferenceID', 'Email', 'PhoneNumber'],
        primaryKey: ['UserID']
    },
    Equipment: {
        columns: ['EquipmentID', 'Name', 'Kind'],
        primaryKey: ['EquipmentID']
    },
    Location1: {
        columns: ['PostalCode', 'Country', 'Province_State', 'City'],
        primaryKey: ['PostalCode', 'Country']
    },
    Location2: {
        columns: ['LocationID', 'Address', 'PostalCode', 'Country', 'Latitude', 'Longitude'],
        primaryKey: ['LocationID']
    },
    Hike1: {
        columns: ['Kind', 'Distance', 'Elevation', 'Duration', 'Difficulty'],
        primaryKey: ['Kind', 'Distance', 'Elevation', 'Duration']
    },
    Hike2: {
        columns: ['HikeID', 'LocationID', 'Name', 'Kind', 'Season', 'TrailCondition', 'Duration', 'Elevation', 'Distance'],
        primaryKey: ['HikeID']
    },
    WeatherWarning: {
        columns: ['SafetyHazardID', 'Description', 'DateIssued', 'SeverityLevel', 'Kind'],
        primaryKey: ['SafetyHazardID']
    },
    AnimalSighting: {
        columns: ['SafetyHazardID', 'Description', 'DateIssued', 'Animal'],
        primaryKey: ['SafetyHazardID']
    },
    ForestFireWarning: {
        columns: ['SafetyHazardID', 'Description', 'DateIssued', 'Rating', 'Cause'],
        primaryKey: ['SafetyHazardID']
    },
    Needs: {
        columns: ['EquipmentID', 'HikeID'],
        primaryKey: ['EquipmentID', 'HikeID']
    },
    Saves: {
        columns: ['UserID', 'HikeID'],
        primaryKey: ['UserID', 'HikeID']
    },
    Has: {
        columns: ['HikeID', 'SafetyHazardID'],
        primaryKey: ['HikeID', 'SafetyHazardID']
    },
    Feedback: {
        columns: ['FeedbackID', 'Rating', 'Review', 'DateSubmitted', 'UserID', 'HikeID'],
        primaryKey: ['FeedbackID']
    }
};

// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
    user: envVariables.ORACLE_USER,
    password: envVariables.ORACLE_PASS,
    connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
    poolMin: 1,
    poolMax: 3,
    poolIncrement: 1,
    poolTimeout: 60
};

// initialize connection pool
async function initializeConnectionPool() {
    try {
        await oracledb.createPool(dbConfig);
        console.log('Connection pool started');
        await ensureSeedData();
    } catch (err) {
        console.error('Initialization error: ' + err.message);
    }
}

async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
        await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
        console.log('Pool closed');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

initializeConnectionPool();

process
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT', closePoolAndExit);


// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
    let connection;
    try {
        connection = await oracledb.getConnection(); // Gets a connection from the default pool 
        return await action(connection);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}


// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
    return await withOracleDB(async (connection) => {
        return true;
    }).catch(() => {
        return false;
    });
}

async function fetchTableRecords(tableName) {
    const definition = getTableDefinition(tableName);
    const projection = definition.columns.join(', ');

    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT ${projection} FROM ${tableName}`);
        return result.rows;
    }).catch(() => []);
}

async function initiateTable(_tableName) {
    return await withOracleDB(async (connection) => {
        await executeSqlScript(connection);
        return true;
    }).catch(() => false);
}

async function insertIntoTable(tableName, recordValues = {}) {
    const definition = getTableDefinition(tableName);
    const normalizedRecord = normalizeRecord(definition, recordValues, tableName);
    const columns = Object.keys(normalizedRecord);

    if (columns.length === 0) {
        throw new Error('No columns provided for insert');
    }

    const bindParams = {};
    const valueTokens = columns.map((column, index) => {
        const bindKey = `val_${index}`;
        bindParams[bindKey] = normalizedRecord[column];
        return `:${bindKey}`;
    });

    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${valueTokens.join(', ')})`,
            bindParams,
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => false);
}

async function updateTableRecords(tableName, criteria = {}, updates = {}) {
    const definition = getTableDefinition(tableName);
    const normalizedCriteria = normalizeRecord(definition, criteria, tableName);
    const normalizedUpdates = normalizeRecord(definition, updates, tableName);

    if (Object.keys(normalizedUpdates).length === 0) {
        throw new Error('No columns provided for update');
    }

    if (Object.keys(normalizedCriteria).length === 0) {
        throw new Error('Update criteria must be provided');
    }

    const binds = {};
    const setClauses = Object.keys(normalizedUpdates).map((column, index) => {
        const bindKey = `set_${index}`;
        binds[bindKey] = normalizedUpdates[column];
        return `${column} = :${bindKey}`;
    });

    const whereClauses = Object.keys(normalizedCriteria).map((column, index) => {
        const bindKey = `where_${index}`;
        binds[bindKey] = normalizedCriteria[column];
        return `${column} = :${bindKey}`;
    });

    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`,
            binds,
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => false);
}

async function countTableRows(tableName) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT COUNT(*) FROM ${tableName}`);
        return result.rows[0][0];
    }).catch(() => -1);
}

async function fetchDemotableFromDb() {
    return fetchTableRecords('AppUser');
}

async function initiateDemotable() {
    return initiateTable();
}

async function insertDemotable(id, name, email, phoneNumber) {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
        throw new Error('UserID must be a valid number');
    }

    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim();
    const trimmedPhone = (phoneNumber || '').trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
        throw new Error('Name, email, and phone number are required');
    }

    return insertIntoTable('AppUser', {
        UserID: numericId,
        Name: trimmedName,
        PreferenceID: null,
        Email: trimmedEmail,
        PhoneNumber: trimmedPhone
    });
}

async function updateNameDemotable(oldName, newName) {
    return updateTableRecords('AppUser', { Name: oldName }, { Name: newName });
}

async function countDemotable() {
    return countTableRows('AppUser');
}

async function executeSqlScript(connection) {
    const statements = await loadSqlStatements();

    for (const statement of statements) {
        const sql = statement.trim();
        if (!sql) {
            continue;
        }

        try {
            await connection.execute(sql);
        } catch (err) {
            const isDropStatement = sql.toUpperCase().startsWith('DROP TABLE');
            const tableMissing = err.errorNum === 942;

            if (isDropStatement && tableMissing) {
                continue;
            }

            console.error(`Failed to execute SQL: ${sql}`);
            throw err;
        }
    }

    await connection.commit();
}

async function loadSqlStatements() {
    if (cachedSqlStatements) {
        return cachedSqlStatements;
    }

    const fileContent = await fs.readFile(sqlFilePath, 'utf8');
    cachedSqlStatements = fileContent
        .split(/;\s*(?:\r?\n|$)/)
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

    return cachedSqlStatements;
}

async function ensureSeedData() {
    // Runs the SQL script once on startup if AppUser is missing or empty
    return withOracleDB(async (connection) => {
        try {
            const result = await connection.execute('SELECT COUNT(*) FROM AppUser');
            const count = Number(result.rows?.[0]?.[0] || 0);

            if (count === 0) {
                console.log('Seeding database from hiketracker.sql...');
                await executeSqlScript(connection);
                console.log('Seeding complete.');
                return true;
            }

            return false;
        } catch (err) {
            const tableMissing = err.errorNum === 942;
            if (tableMissing) {
                console.log('Schema missing. Running hiketracker.sql to initialize...');
                await executeSqlScript(connection);
                console.log('Seeding complete.');
                return true;
            }

            throw err;
        }
    }).catch((err) => {
        console.error('Failed to seed database:', err.message);
        return false;
    });
}

function getTableDefinition(tableName) {
    const definition = tableDefinitions[tableName];
    if (!definition) {
        throw new Error(`Unsupported table: ${tableName}`);
    }
    return definition;
}

function normalizeRecord(definition, record = {}, tableName = 'table') {
    const normalized = {};
    if (!record) {
        return normalized;
    }

    const columnMap = definition.columns.reduce((map, column) => {
        map[column.toUpperCase()] = column;
        return map;
    }, {});

    Object.entries(record).forEach(([key, value]) => {
        const targetColumn = columnMap[key.toUpperCase()];
        if (!targetColumn) {
            throw new Error(`Column ${key} is not valid for table ${tableName}`);
        }
        normalized[targetColumn] = value;
    });

    return normalized;
}

module.exports = {
    testOracleConnection,
    fetchDemotableFromDb,
    initiateDemotable, 
    insertDemotable, 
    updateNameDemotable, 
    countDemotable,
    fetchTableRecords,
    initiateTable,
    insertIntoTable,
    updateTableRecords,
    countTableRows,
    tableDefinitions,
    ensureSeedData
};
