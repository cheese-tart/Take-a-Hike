const oracledb = require('oracledb');
 const loadEnvFile = require('./utils/envUtil');

 const envVariables = loadEnvFile('./.env');

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

 async function fetchDemotableFromDb() {
     return await withOracleDB(async (connection) => {
         const result = await connection.execute('SELECT * FROM DEMOTABLE');
         return result.rows;
     }).catch(() => {
         return [];
     });
 }

 async function initiateDemotable() {
     return await withOracleDB(async (connection) => {
         try {
             await connection.execute(`DROP TABLE DEMOTABLE`);
         } catch(err) {
             console.log('Table might not exist, proceeding to create...');
         }

         const result = await connection.execute(`
             CREATE TABLE DEMOTABLE (
                 id NUMBER PRIMARY KEY,
                 name VARCHAR2(20)
             )
         `);
         return true;
     }).catch(() => {
         return false;
     });
 }

 // 1. INSERT
 async function insertAppUser(uid, name, pid, email, pnum) {
     return await withOracleDB(async (connection) => {
         const result = await connection.execute(
             `INSERT INTO AppUser (uid, name, pid, email, pnum) VALUES (:uid, :name, :pid, :email, :pnum)`,
             [uid, name, pid, email, pnum],
             { autoCommit: true }
         );

         return result.rowsAffected && result.rowsAffected > 0;
     }).catch(() => {
         return false;
     });
 }
// 1. INSERT
 async function insertPreference(pid, dist, dur, elev, diff) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO Preference (pid, dist, dur, elev, diff) VALUES (:pid, :dist, :dur, :elev, :diff)`,
            [pid, dist, dur, elev, diff],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
 }

 // 2. UPDATE
 async function updateAppUser(uid, newName, email, pnum) {
    return await withOracleDB(async (connection) => {
        const fields = [];
        const binds = { uid };

        if (newName != null) {
            fields.push("name = :newName");
            binds.newName = newName;
        }

        if (email != null) {
            fields.push("email = :email");
            binds.email = email;
        }

        if (pnum != null) {
            fields.push("pnum = :pnum");
            binds.pnum = pnum;
        }

        if (fields.length === 0) {
            return false;
        }

        const sql = `
            UPDATE AppUser
            SET ${fields.join(", ")}
            WHERE uid = :uid
        `;

        const result = await connection.execute(sql, binds, { autoCommit: true });

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function deleteAppUser(uid) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            'DELETE FROM AppUser'
        )
    });
}

 async function countDemotable() {
     return await withOracleDB(async (connection) => {
         const result = await connection.execute('SELECT Count(*) FROM DEMOTABLE');
         return result.rows[0][0];
     }).catch(() => {
         return -1;
     });
 }



 module.exports = {
     testOracleConnection,
     fetchDemotableFromDb,
     initiateDemotable, 
     insertDemotable, 
     updateNameDemotable, 
     countDemotable
 };