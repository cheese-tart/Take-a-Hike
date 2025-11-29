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

 async function countDemotable() {
     return await withOracleDB(async (connection) => {
         const result = await connection.execute('SELECT Count(*) FROM DEMOTABLE');
         return result.rows[0][0];
     }).catch(() => {
         return -1;
     });
 }











// Fetch All Tables 
async function fetchAppUserFromDb() {
    try {
        
        return await withOracleDB(async (connection) => {
            const result = await connection.execute('SELECT * FROM AppUser'); // removed semicolon
            return result.rows;
        });
        
    } catch (err) {
        console.error('Error fetching AppUser:', err);
        return [];
    }
}

async function fetchHikeTablesFromDb() {
    try {
        return await withOracleDB(async (connection) => {
            // Join Hike1 and Hike2 for normalized display
            const query = `
                SELECT 
                    h2.HikeID,
                    h2.Name,
                    h2.Season,
                    h2.TrailCondition,
                    h1.Kind,
                    h1.Distance,
                    h1.Elevation,
                    h1.Duration,
                    h1.Difficulty,
                    h2.LocationID
                FROM Hike2 h2
                JOIN Hike1 h1
                    ON h2.Kind = h1.Kind
                    AND h2.Distance = h1.Distance
                    AND h2.Elevation = h1.Elevation
                    AND h2.Duration = h1.Duration
            `;
            const result = await connection.execute(query);
            // console.log('Fetched hikes from DB:', result.rows); // Debugging
            return result.rows;
        });
    } catch (err) {
        console.error('Error fetching Hikes:', err);
        return [];
    }
}

 // 1. INSERT
async function insertAppUser(uid, name, pid, email, pnum) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            // 1. UPDATED SQL: Changed :uid to :u_id to avoid "ORA-01745"
            `INSERT INTO AppUser (UserID, Name, PreferenceID, Email, PhoneNumber)
             VALUES (:u_id, :user_name, :pid, :email, :pnum)`,
            
            // 2. UPDATED DATA: Using an Object {} to match the names above
            {
                u_id: uid,
                user_name: name,
                pid: pid,
                email: email,
                pnum: pnum
            },
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch((err) => {
        console.error("DB Error:", err);
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
// Update AppUser (simple positional bind version)
async function updateAppUser(uid, newName, email, pnum) {
    return await withOracleDB(async (connection) => {
        const fields = [];
        const values = [];

        if (newName != null && newName !== "") {
            fields.push("Name = :1");
            values.push(newName);
        }

        if (email != null && email !== "") {
            fields.push("Email = :2");
            values.push(email);
        }

        if (pnum != null && pnum !== "") {
            fields.push("PhoneNumber = :3");
            values.push(pnum);
        }

        if (fields.length === 0) {
            return false; // nothing to update
        }

        const sql = `
            UPDATE AppUser
            SET ${fields.join(", ")}
            WHERE UserID = :${fields.length + 1}
        `;

        // Append UID at the end for positional bind
        values.push(uid);

        console.log("SQL:", sql);
        console.log("Values:", values);

        const result = await connection.execute(sql, values, { autoCommit: true });

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch((err) => {
        console.error("DB error:", err);
        return false;
    });
}

// 3. DELETE
async function deleteAppUser(uid) {
    if (!uid) return false;

    const numericUid = Number(uid);
    if (isNaN(numericUid)) return false;

    return await withOracleDB(async (connection) => {
        // Delete Feedback first
        await connection.execute(
            `DELETE FROM Feedback WHERE UserID = :1`,
            [numericUid],
            { autoCommit: true }
        );

        // Delete Preference if linked
        await connection.execute(
            `DELETE FROM Preference WHERE PreferenceID = (SELECT PreferenceID FROM AppUser WHERE UserID = :1)`,
            [numericUid],
            { autoCommit: true }
        );

        // Delete main user
        const result = await connection.execute(
            `DELETE FROM AppUser WHERE UserID = :1`,
            [numericUid],
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            console.error(`No user found with UserID: ${numericUid}`);
            return false;
        }

        return true;
    }).catch(() => false);
}

// 4. SELECT
async function selectHike(filters) {
    return await withOracleDB(async (connection) => {
        const conditions = [];
        const binds = [];

        if (filters.kind) {
            conditions.push(`h2.Kind = :${binds.length + 1}`);
            binds.push(filters.kind);
        }
        if (filters.distance) {
            conditions.push(`h2.Distance = :${binds.length + 1}`);
            binds.push(filters.distance);
        }
        if (filters.elevation) {
            conditions.push(`h2.Elevation = :${binds.length + 1}`);
            binds.push(filters.elevation);
        }
        if (filters.duration) {
            conditions.push(`h2.Duration = :${binds.length + 1}`);
            binds.push(filters.duration);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const SQL = `
            SELECT h2.Name
            FROM Hike2 h2
            JOIN Hike1 h1
              ON h1.Kind = h2.Kind
             AND h1.Distance = h2.Distance
             AND h1.Elevation = h2.Elevation
             AND h1.Duration = h2.Duration
            ${whereClause}
        `;

        const result = await connection.execute(SQL, binds);
        return result.rows;
    }).catch(() => []);
}
async function projectHike(attributes) {
    // console.log('--- projectHike called ---');
    // console.log('Attributes to select:', attributes);

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

        // console.log('Generated SQL:', SQL);

        const result = await connection.execute(SQL);
        // console.log('Number of rows returned:', result.rows.length);
        // console.log('Rows:', result.rows);

        return result.rows;
    }).catch((err) => {
        console.error('Error in projectHike:', err);
        return [];
    });
}
// 6. JOIN: Find users who saved a specific hike
async function findUsersWhoHiked(hid) {
    return await withOracleDB(async (connection) => {
        const SQL = `
            SELECT a.Name
            FROM AppUser a
            JOIN Saves s ON a.UserID = s.UserID
            JOIN Hike2 h2 ON s.HikeID = h2.HikeID
            WHERE h2.HikeID = :hid
        `;

        const result = await connection.execute(SQL, [hid]);
        return result.rows;
    }).catch(() => {
        return [];
    });
}
// 7. Aggregation with GROUP BY: Average Difficulty per Season (with debugging)
async function findAvgDiffPerSeason() {
    // console.log('--- findAvgDiffPerSeason called ---');

    return await withOracleDB(async (connection) => {
        const SQL = `
            SELECT h2.Season, AVG(h1.Difficulty) AS AvgDifficulty
            FROM Hike2 h2
            JOIN Hike1 h1
              ON h1.Kind = h2.Kind
             AND h1.Distance = h2.Distance
             AND h1.Elevation = h2.Elevation
             AND h1.Duration = h2.Duration
            GROUP BY h2.Season
            ORDER BY h2.Season
        `;

        // console.log('Generated SQL:', SQL);

        const result = await connection.execute(SQL);

        // console.log('Number of rows returned:', result.rows.length);
        // console.log('Rows:', result.rows);

        return result.rows;
    }).catch((err) => {
        console.error('Error in findAvgDiffPerSeason:', err);
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
 async function findUsersWhoHikedEveryHike() {
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

 module.exports = {
    testOracleConnection,
    insertAppUser,
    insertPreference, 
    updateAppUser, 
    deleteAppUser, 
    fetchAppUserFromDb,
    fetchHikeTablesFromDb,
    selectHike,
    projectHike,
    findUsersWhoHiked,
    findAvgDiffPerSeason,
    findSafeHikes,
    findGoodConditionHikes,
    findHikeByRating: findUsersWhoHikedEveryHike
 };
