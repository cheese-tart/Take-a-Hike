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

//  router.get('/demotable', async (req, res) => {
//      const tableContent = await appService.fetchDemotableFromDb();
//      res.json({data: tableContent});
//  });

//  router.post("/initiate-demotable", async (req, res) => {
//      const initiateResult = await appService.initiateDemotable();
//      if (initiateResult) {
//          res.json({ success: true });
//      } else {
//          res.status(500).json({ success: false });
//      }
//  });

//  router.post("/insert-demotable", async (req, res) => {
//      const { id, name } = req.body;
//      const insertResult = await appService.insertDemotable(id, name);
//      if (insertResult) {
//          res.json({ success: true });
//      } else {
//          res.status(500).json({ success: false });
//      }
//  });

//  router.post("/update-name-demotable", async (req, res) => {
//      const { oldName, newName } = req.body;
//      const updateResult = await appService.updateNameDemotable(oldName, newName);
//      if (updateResult) {
//          res.json({ success: true });
//      } else {
//          res.status(500).json({ success: false });
//      }
//  });

//  router.get('/count-demotable', async (req, res) => {
//      const tableCount = await appService.countDemotable();
//      if (tableCount >= 0) {
//          res.json({ 
//              success: true,  
//              count: tableCount
//          });
//      } else {
//          res.status(500).json({ 
//              success: false, 
//              count: tableCount
//          });
//      }
//  });

 router.get('/appusers', async (req, res) => {
     const users = await appService.fetchAppUsersFromDb();
     res.json({data: users});
 });

 router.get('/hikes', async (req, res) => {
     const users = await appService.selectHike();
     res.json({data: users});
 });

router.get('/preferences', async (req, res) => {
     const users = await appService.fetchPreferencesFromDb();
     res.json({data: users});
 });

  router.post("/insert-appuser", async (req, res) => {
     const { uid, name, pid, email, pnum } = req.body;
     const insertResult = await appService.insertAppUser(uid, name, pid, email, pnum);
     if (insertResult) {
         res.json({ success: true });
     } else {
         res.status(500).json({ success: false });
     }
 });

 router.post("/insert-preference", async (req, res) => {
     const { pid, dist, dur, elev, diff } = req.body;
     const insertResult = await appService.insertPreference(pid, dist, dur, elev, diff);
     if (insertResult) {
         res.json({ success: true });
     } else {
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

 router.delete('/appusers/:uid', async (req, res) => {
  const { uid } = req.params;

  try {
    const deleted = await appService.deleteAppUser(Number(uid));
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

 module.exports = router;