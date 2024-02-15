//Import modules
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const {v4: uuidv4} = require('uuid');
require('dotenv').config();

//Import models
const MeetingModel = require('../models/meeting.js');

//Global variables
const router = express.Router();
const homeDir = path.join(__dirname, '..');

//Connect to MongoDB
mongoose.set("strictQuery", false);
mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.PROJECT_NAME}`);
var db = mongoose.connection;

//Configure routes

//GET routes
router.get('/', function(req, res){
    res.status(200).sendFile(`${homeDir}/Client/Meetings/Main/index.html`);
});

//POST routes

//PUT routes
router.put('/new-meeting', async function(req, res){
    try{
        var NewMeeting = new MeetingModel({
            MeetingType: req.body.MeetingType,
            DateStr: req.body.MeetingDate,
            Room: req.body.MeetingRoom,
            UUID: await uuidv4(),
            SpringfestYear: process.env.YEAR
        });
        await NewMeeting.save();
        res.status(200).send(NewMeeting);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//Additional functions

//Export router
module.exports = router;