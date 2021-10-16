const express = require('express');
const router = express.Router();

const notificationsControllers = require('./notificationsController');
const {authenticateUser} = require('../users/usersControllers');

router.post('/sendNotification', authenticateUser, notificationsControllers.sendNotification)
// router.get('/getNotification/:notification_id', authenticateUser, notificationsControllers.getNotification);

module.exports = router