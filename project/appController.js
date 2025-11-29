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

router.post("/initiate-demotable", async (req, res) => {
    const initiateResult = await appService.initiateDemotable();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

// In your appController.js
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

router.post("/update-name-demotable", async (req, res) => {
    const { oldName, newName } = req.body;
    const updateResult = await appService.updateNameDemotable(oldName, newName);
    if (updateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/count-demotable', async (req, res) => {
    const tableCount = await appService.countDemotable();
    if (tableCount >= 0) {
        res.json({ 
            success: true,  
            count: tableCount
        });
    } else {
        res.status(500).json({ 
            success: false, 
            count: tableCount
        });
    }
});


module.exports = router;