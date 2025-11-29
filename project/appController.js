const express = require('express');
const appService = require('./appService');

const router = express.Router();

// ----------------------------------------------------------
// API endpoints
// Modify or extend these routes based on your project's needs.
router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testOracleConnection();
    if (isConnect) {
        res.send('connected');
    } else {
        res.send('unable to connect');
    }
});

// LEGACY ENDPOINTS
router.post("/initiate-demotable", async (req, res) => {
    const initiateResult = await appService.initiateDemotable();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

// IMPLEMENTED ENDPOINTS
router.get('/usertable', async (req, res) => {
    const tableContent = await appService.fetchAppUserFromDb();
    res.json({data: tableContent});
});

router.get('/hiketable', async (req, res) => {
    try {
        const hikes = await appService.fetchHikeTablesFromDb();
        res.json({ data: hikes });
    } catch (err) {
        console.error('Error in router /hiketable route:', err);
        res.status(500).json({ error: 'Failed to fetch hikes' });
    }
});

// insert appuser
router.post("/insert-appuser", async (req, res) => {
    const { UserID, Name, PreferenceID, Email, PhoneNumber } = req.body;

    try {
        const insertResult = await appService.insertAppUser(
            UserID,
            Name,
            PreferenceID,
            Email,
            PhoneNumber
        );

        if (insertResult) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false });
        }
    } catch (err) {
        console.error('Error inserting AppUser:', err);
        res.status(500).json({ success: false });
    }
});

router.post("/update-appuser", async (req, res) => {
    const { uid, newName, email, pnum } = req.body;

    const updateResult = await appService.updateAppUser(uid, newName, email, pnum);
    if (updateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

// DELETE user route
router.post("/delete-appuser", async (req, res) => {
    const { uid } = req.body;

    if (!uid) {
        return res.status(400).json({ success: false, message: "UserID required" });
    }

    const deleteResult = await appService.deleteAppUser(uid);

    if (deleteResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false, message: "Failed to delete user" });
    }
});

// SELECT hike 
router.post('/selectHike', async (req, res) => {
    const filters = req.body;
    const hikes = await appService.selectHike(filters);
    res.json(hikes);
});

// POST /projectHike
router.post('/projectHike', async (req, res) => {
    try {
        const { attributes } = req.body; // expecting a string like "h2.Name, h1.Difficulty"
        
        if (!attributes) {
            return res.status(400).json({ error: "No attributes provided" });
        }

        const projectedHikes = await appService.projectHike(attributes);
        res.json(projectedHikes);
    } catch (err) {
        console.error('Error in /projectHike:', err);
        res.status(500).json({ error: "Failed to project hikes" });
    }
});

// Join 
// POST /findUsersWhoHiked
router.post('/findUsersWhoHiked', async (req, res) => {
    try {
        const { hid } = req.body;

        if (!hid) {
            return res.status(400).json({ error: "No HikeID provided" });
        }

        const users = await appService.findUsersWhoHiked(hid);
        res.json(users);
    } catch (err) {
        console.error('Error in /findUsersWhoHiked:', err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});


// Aggregation 7 
// POST /avgDiffPerSeason
router.post('/avgDiffPerSeason', async (req, res) => {
    try {
        const results = await appService.findAvgDiffPerSeason();
        res.json(results);
    } catch (err) {
        console.error('Error in /avgDiffPerSeason:', err);
        res.status(500).json({ error: "Failed to fetch average difficulty per season" });
    }
});

// Having 8
// POST /safeHikes
router.post('/safeHikes', async (req, res) => {
    try {
        const safeHikes = await appService.findSafeHikes();
        res.json(safeHikes);
    } catch (err) {
        console.error('Error in /safeHikes:', err);
        res.status(500).json({ error: "Failed to fetch safe hikes" });
    }
});

// Nested aggregation with GROUP BY 9
// POST /users-who-hiked-every-hike
router.post(`/good-condition-hikes`, async (req, res) => {
    try {
        const results = await appService.findGoodConditionHikes();
        res.json(results);
    } catch (err) {
        console.error('Error in /good-condition-hikes:', err);
        res.status(500).json({ error: "Failed to fetch good conditoin hikes" });
    }
});

// Division 10
// POST /users-who-hiked-every-hike
router.post(`/users-who-hiked-every-hike`, async (req, res) => {
    try {
        const results = await appService.findUsersWhoHikedEveryHike();
        res.json(results);
    } catch (err) {
        console.error('Error in /users-who-hiked-every-hike:', err);
        res.status(500).json({ error: "Failed to fetch average difficulty per season" });
    }
});

module.exports = router;
