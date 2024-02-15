//Import node modules
const express = require('express');
const fs = require('fs');
const https = require('https');
const mongoose = require('mongoose');
require('dotenv').config();

//Import routes
const MeetingsRouter = require('./routes/meetings.js');
const ToolsRouter = require('./routes/tools.js');

//Import the SSL certificate
const sslOptions = {
    key: fs.readFileSync('./cert/server.key'),
    cert: fs.readFileSync('./cert/server.crt')
};

//Global variables
const app = express();
const server = https.createServer(sslOptions, app);
const homeDir = __dirname;

//Server config
app.use(express.static(__dirname + '/Client'));
app.use(express.json());

//Connect to MongoDB database
mongoose.set("strictQuery", false);
mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.PROJECT_NAME}`);
var db = mongoose.connection;

//GET routes
app.get('/', function(req, res){
    res.status(200).sendFile(`${homeDir}/Client/Home/index.html`);
});
app.get('/download/:file', function(req, res){
    try{
        res.status(200).download(`${homeDir}/Client/files/${req.params.file}`);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//POST routes

//Connect routes
app.use('/meetings', MeetingsRouter);
app.use('/tools', ToolsRouter);

//Start server
server.listen(process.env.PORT);
console.log(`${process.env.PROJECT_NAME} listening on port: ${process.env.PORT}`);