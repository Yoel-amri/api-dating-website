const express = require('express');
const router = express.Router();

//Users Routes
const usersControllers = require('./usersControllers');
const blockReportController = require('./block-reportController');
const uploadRoutes = require('./uploadRoutes');

router.post('/signUp', usersControllers.signUp);
router.get('/confirmMail/:token', usersControllers.confirmMail);
router.post('/login', usersControllers.login);
router.post('/resetPassword', usersControllers.resetPassword);
router.get('/getUserData/:id', usersControllers.authenticateUser, usersControllers.getUserData);
router.post('/logout', usersControllers.authenticateUser ,usersControllers.logOut);
router.post('/like', usersControllers.authenticateUser, usersControllers.like);
router.post('/view', usersControllers.authenticateUser, usersControllers.view);
router.post('/update', usersControllers.authenticateUser, usersControllers.update);
router.post('/unlike', usersControllers.authenticateUser, usersControllers.unlike);
router.post('/block', usersControllers.authenticateUser, blockReportController.block);
router.post('/report', usersControllers.authenticateUser, blockReportController.report);
router.use('/upload', uploadRoutes);

module.exports = router;
