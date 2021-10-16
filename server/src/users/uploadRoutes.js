const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');

const { v4: uuidv4 } = require('uuid');
const { users } = require('../services/schema/types');


const uploadControllers = require('./uploadControllers');
const { authenticateUser } = require('./usersControllers');

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {

      const [{id: userId}] = await users.findMany({
          where: {
              username: req.username
          },
          select: {
              id: true
          }
      })
      cb(null, `public/${userId}`);
  },
  filename: (req, file, cb) => {
      var imgName = uuidv4() + path.extname(file.originalname);

      cb(null, imgName);
  }
})

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            return callback(new Error('Only images are allowed'))
        }
        if (file.mimetype !== "image/png" && file.mimetype !== "image/jpg" && file.mimetype !== "image/jpeg") {
            return callback(new Error('Only images allowed'))
        }
        callback(null, true)
    }
})


router.post('/profile', authenticateUser, upload.single('profile_img'), uploadControllers.uploadProfileImg)

router.post('/photos', authenticateUser, upload.array('pictures', 4), uploadControllers.uploadProfileImages)

module.exports = router