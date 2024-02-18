//Import modules
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const {v4: uuidv4} = require('uuid');
require('dotenv').config();

//Import models
const TeamModel = require('../models/team.js');

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
    res.status(200).sendFile(`${homeDir}/Client/Teams/Main/index.html`);
});
router.get('/:uuid', function(req, res){
    res.status(200).sendFile(`${homeDir}/Client/Teams/Team/index.html`);
});

//POST routes
router.post('/get-teams', async function(req, res){
    try{
        var TeamsRaw = await TeamModel.find({SpringfestYear: process.env.YEAR}, null, {sort: {Name: 1}});
        var Teams = [];
        for(var i=0; i<TeamsRaw.length; i++){
            var Managers = 0;
            for(var j=0; j<TeamsRaw[i].Members.length; j++){
                if(TeamsRaw[i].Members[j].Role == "Manager") Managers++;
            }
            Teams.push({
                Name: TeamsRaw[i].Name,
                UUID: TeamsRaw.UUID,
                Managers: Managers,
                Members: TeamsRaw[i].Members.length - Managers
            });
        }
        res.status(200).send(Teams);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//PUT routes
router.put('/create-team', async function(req, res){
    try{
        var TeamName = req.body?.TeamName || null;
        if(TeamName){
            if(!(await TeamModel.exists({Name: TeamName, SpringfestYear: process.env.YEAR}))){
                var Team = new TeamModel({
                    Name: TeamName,
                    UUID: uuidv4()
                });
                await Team.save();
                res.status(200).send({UUID: Team.UUID});    
            }else{
                res.status(401).send({Error: "Team already exists this year"});
            }
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//Export router
module.exports = router;