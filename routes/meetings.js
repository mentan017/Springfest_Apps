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
router.get('/:uuid', function(req, res){
    res.status(200).sendFile(`${homeDir}/Client/Meetings/Meeting/index.html`);
})

//POST routes
router.post('/get-meetings', async function(req, res){
    try{
        var meetings = await MeetingModel.find({SpringfestYear: process.env.YEAR}, null, {sort: {DateShort: -1, DateStr: 1}});
        res.status(200).send(meetings);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/:uuid', async function(req, res){
    try{
        var UUID = req.params.uuid;
        var meeting = await MeetingModel.findOne({UUID: UUID});
        res.status(200).send(meeting);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//PUT routes
router.put('/new-meeting', async function(req, res){
    try{
        var NewMeeting = new MeetingModel({
            MeetingType: req.body.MeetingType,
            DateShort: req.body.MeetingDateRaw,
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
router.put('/update-meeting', async function(req, res){
    try{
        var months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        var data = req.body;
        var Meeting = await MeetingModel.findOne({UUID: data.UUID});
        var dateRaw = (Meeting.DateShort);
        dateRaw = dateRaw.split("-");
        //Parse date
        var newDate = (data.MeetingDate);
        newDate = newDate.split(" ");
        dateRaw[0] = newDate[2].split(",");
        for(var i=0; i<months.length; i++){
            if(newDate[0].toLowerCase() == months[i]){
                i=12;
                dateRaw[1] = `${i+1}`;
                if(dateRaw.length == 1) dateRaw[1] = `0${i+1}`;
            }
        }
        dateRaw[2] = newDate[1];
        Meeting.MeetingType = data.MeetingType;
        Meeting.DateShort = dateRaw.join("-");
        Meeting.DateStr = data.MeetingDate;
        Meeting.Room = data.MeetingRoom;
        await Meeting.save();
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/new-discussion-point', async function(req, res){
    try{
        var UUID = req.body.UUID;
        var Meeting = await MeetingModel.findOne({UUID: UUID});
        var index = (Meeting.DiscussionPoints).length;
        Meeting.DiscussionPoints.push({Point: "Click here to add a discussion point", Progress: 0});
        await Meeting.save();
        res.status(200).send({index: index});
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
})
router.put('/update-discussion-point', async function(req, res){
    try{
        var data = req.body;
        var Meeting = await MeetingModel.findOne({UUID: data.UUID});
        Meeting.DiscussionPoints[data.Index] = {
            Point: data.DiscussionPoint,
            Progress: data.Progress
        }
        await Meeting.save();
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//Additional functions

//Export router
module.exports = router;