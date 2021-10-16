const dotenv = require('dotenv');
require('dotenv').config()
const path = require('path')
var cookieParser = require("cookie-parser");
const express = require("express")
const app = express();

const port = process.env.PORT;

app.use(express.json());
app.use (function (error, req, res, next){
  //Catch json error
  if (error instanceof SyntaxError) {
    res.status(400).send("Syntax error")
  }
});
app.use(cookieParser());


const apiRoutes = require('./api');
const { SqlError } = require('./src/services/dbErrors');

var publicPictures = path.join(__dirname, 'public');
app.use(express.static(publicPictures));


app.use('/api', apiRoutes);
 
app.use('*', (req, res, err) => {
  console.error("BAD url!!");
  res.sendStatus(404)
})

app.listen(port, () => {
  console.log(`Matcha server listening on port ${port}`);
});