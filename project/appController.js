const express = require('express');
const appService = require('./appService');

const router = express.Router();

function respondWithError(res, err, defaultMessage = 'Operation failed') {
    const statusCode = err && err.message ? 400 : 500;
    res.status(statusCode).json({
        success: false,
        message: err?.message || defaultMessage
    });
}

// ----------------------------------------------------------
// Core demo routes used by the current frontend
router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testOracleConnection();
    if (isConnect) {
        res.send('connected');
    } else {
        res.send('unable to connect');
    }
});

const managedTables = Object.keys(appService.tableDefinitions || {});

managedTables.forEach((tableName) => {
    const slug = tableName.toLowerCase();

    router.get(`/${slug}`, async (req, res) => {
        try {
            const data = await appService.fetchTableRecords(tableName);
            res.json({ success: true, data });
        } catch (err) {
            respondWithError(res, err, `Failed to fetch ${tableName}`);
        }
    });

    router.post(`/initiate-${slug}`, async (req, res) => {
        try {
            const initResult = await appService.initiateTable(tableName);
            if (initResult) {
                res.json({ success: true });
            } else {
                res.status(500).json({ success: false });
            }
        } catch (err) {
            respondWithError(res, err, `Failed to initiate ${tableName}`);
        }
    });

    router.post(`/insert-${slug}`, async (req, res) => {
        try {
            const insertResult = await appService.insertIntoTable(tableName, req.body);
            if (insertResult) {
                res.json({ success: true });
            } else {
                res.status(500).json({ success: false });
            }
        } catch (err) {
            respondWithError(res, err, `Failed to insert into ${tableName}`);
        }
    });

    router.post(`/update-${slug}`, async (req, res) => {
        const { criteria, updates } = req.body || {};
        try {
            const updateResult = await appService.updateTableRecords(tableName, criteria, updates);
            if (updateResult) {
                res.json({ success: true });
            } else {
                res.status(404).json({ success: false, message: 'No rows updated' });
            }
        } catch (err) {
            respondWithError(res, err, `Failed to update ${tableName}`);
        }
    });
});

module.exports = router;
