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

//  async function fetchDemotableFromDb() {
//      return await withOracleDB(async (connection) => {
//          const result = await connection.execute('SELECT * FROM DEMOTABLE');
//          return result.rows;
//      }).catch(() => {
//          return [];
//      });
//  }

//  async function initiateDemotable() {
//      return await withOracleDB(async (connection) => {
//          try {
//              await connection.execute(`DROP TABLE DEMOTABLE`);
//          } catch(err) {
//              console.log('Table might not exist, proceeding to create...');
//          }

//          const result = await connection.execute(`
//              CREATE TABLE DEMOTABLE (
//              id NUMBER PRIMARY KEY,
//                  name VARCHAR2(20)
//              )
//          `);
//          return true;
//      }).catch(() => {
//          return false;
//      });
//  }

 // 1. INSERT
 async function insertAppUser(uid, name, pid, email, pnum) {
     return await withOracleDB(async (connection) => {
         const result = await connection.execute(
             `
             INSERT INTO AppUser (uid, name, pid, email, pnum)
             VALUES (:uid, :name, :pid, :email, :pnum)
             `,
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
            `
            INSERT INTO Preference (pid, dist, dur, elev, diff)
            VALUES (:pid, :dist, :dur, :elev, :diff)
            `,
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

// 3. DELETE
 async function deleteAppUser(uid) {
     return await withOracleDB(async (connection) => {
         const result = await connection.execute(
            `
            DELETE FROM AppUser
            WHERE UserID = :uid
            `,
            [uid],
            { autoCommit: true }
         );

         await connection.execute(
            `
            DELETE FROM Preference
            WHERE UserID = :uid
            `,
            [uid],
            { autoCommit: true }
         );

         await connection.execute(
            `
            DELETE FROM Feedback
            WHERE UserID = :uid
            `,
            [uid],
            { autoCommit: true }
         );

         const APPUSERS = await connection.execute(
            `
            SELECT *
            FROM AppUser
            `
         );

        console.log(APPUSERS.rows);

        if (result.rowsAffected === 0) {
            console.error('No user found with UserID: ${uid}');
            return false;
        }

        return true;
    }).catch(() => {
        return false;
    });
}

// 4. SELECT
 async function selectHike(query) {
     return await withOracleDB(async (connection) => {
         const SQL = `
        SELECT h2.name
        FROM Hike2 h2
        JOIN Hike1 h1
          ON h1.Kind = h2.Kind
         AND h1.Distance = h2.Distance
         AND h1.Elevation = h2.Elevation
         AND h1.Duration = h2.Duration
        WHERE ${query}
        `;
         const result = await connection.execute(SQL, [query]);
         return result.rows;
    }).catch(() => {
        return [];
    });
}

// 5. PROJECTION
 async function projectHike(attributes) {
     return await withOracleDB(async (connection) => {
         const SQL = `
        SELECT ${attributes}
        FROM Hike1 h1
        JOIN Hike2 h2
          ON h1.Kind = h2.Kind
         AND h1.Distance = h2.Distance
         AND h1.Elevation = h2.Elevation
         AND h1.Duration = h2.Duration
        `;
         const result = await connection.execute(SQL, [attributes]);
         return result.rows;
    }).catch(() => {
        return [];
    })
}

// 6. JOIN
 async function findUsersWhoHiked(hid) {
     return await withOracleDB(async (connection) => {
         const SQL = `
        SELECT a.Name
        FROM AppUser a
        JOIN Saves s ON a.UserID = s.UserID
        JOIN Hike2 h2 ON s.HikeID = h2.HikeID
        WHERE h2.HikeID = :hid
        `;
         const result = await connection.exectute(SQL, [hid]);
        return result.rows;
    }).catch(() => {
        return [];
    })
}

// 7. Aggergation with GROUP BY
 async function findAvgDiffPerSeason() {
     return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT h2.Season, AVG(h1.difficulty)
            FROM Hike2 h2
            JOIN Hike1 h1
              ON h1.Kind = h2.Kind
             AND h1.Distance = h2.Distance
             AND h1.Elevation = h2.Elevation
             AND h1.Duration = h2.Duration
            GROUP BY h2.Season
        `);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// 8. Aggregation with HAVING
 async function findSafeHikes() {
     return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT h2.name
            FROM Hike2 h2
            JOIN Has h ON h2.HikeID = h.HikeID
            GROUP BY h2.HikeID
            HAVING COUNT(h.SafetyHazardID) < 1
        `);
        return result.rows
    }).catch(() => {
        return [];
    });
}

// 9. Nested aggregation with GROUP BY
 async function findGoodConditionHikes() {
     return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT h2.Name, h2.Season, h2.TrailCondition
            FROM Hike2 h2
            GROUP BY h2.HikeID, h2.Name, h2.Season, h2.TrailCondition
            HAVING h2.TrailCondition > (
                SELECT AVG(h2b.TrailCondition)
                FROM Hike2 h2b
                WHERE h2bSeason = h2.season
            )
        `);
        return result.rows;
    }).catch(() => {
        return [];
    })
}

// 10. DIVISION
 async function findHikeByRating() {
     return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT u.Name
            FROM AppUser u
            WHERE NOT EXISTS (
                SELECT h.HikeID
                FROM Hike2 h
                MINUS (
                    SELECT s.HikeId
                    FROM Saves s
                    WHERE s.UserID = u.UserID
                )
            )
        `)
    })
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
