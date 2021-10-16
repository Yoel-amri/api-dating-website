const express = require('express');
const router = express.Router();

//Users Routes
const messagesControllers = require('./messagesControllers');
const {authenticateUser} = require('../users/usersControllers');

router.post('/sendMessage', authenticateUser , messagesControllers.sendMessage)
router.get('/getMessage/:message_id', authenticateUser, messagesControllers.getMessage);

module.exports = router
