const express = require('express');
const { authenticateUser } = require('../users/usersControllers');
const { getProposals } = require('./matchingControllers');
const router = express.Router();

router.get('/profiles', authenticateUser, getProposals);

module.exports = router;
