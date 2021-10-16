const express = require('express');
const { JsonWebTokenError } = require('jsonwebtoken');
const { SqlError, SqlDuplicateColumnError, OrmError } = require('./src/services/dbErrors');
const router = express.Router();

const usersRoutes = require('./src/users/usersRoutes');
const messagesRoutes = require('./src/messages/messagesRoutes');
const notificationsRoutes = require('./src/notifications/notificationsRoutes');
const multer = require('multer');
// const authenticateUser = require('../middlewares/authenticateUser');
const matchingRoutes = require('./src/matching/matchingRoutes');

router.use('/users', usersRoutes);
router.use('/messages', messagesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/matching', matchingRoutes);


router.use((error, req, res, next) => {
    console.log("Error Handling Middleware called !!!")
    console.log("Error message ===>" ,error.message)
    console.log("Error name    ===>", error.name)
    console.log('In path: ', req.path)
    
    if (error instanceof JsonWebTokenError) {
        res.status(400).send('Invalid JWT');
    }
    else if (error instanceof multer.MulterError) {
        res.status(500).send("Error uploading file");
    }
    else if (error instanceof SqlDuplicateColumnError) {
        res.status(400).send(`${error.duplicateColumn} already exists !`);
    }
    else if (error instanceof OrmError || error instanceof SqlError) {
        res.status(500).send("Internal server error");
    }
    else {
        res.status(500).send("Internal server error !")
    }
  })

module.exports = router;