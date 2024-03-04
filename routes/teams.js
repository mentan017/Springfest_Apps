//Import modules
const excelToJson = require('convert-excel-to-json');
const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const {v4: uuidv4} = require('uuid');
require('dotenv').config();

//Import models
const MemberModel = require('../models/member.js');
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
/*router.get('/duplicates', async function(req, res){
    var members = await MemberModel.find({});
    var indivEmail = [];
    var dupeEmail = [];
    for(var i=0; i<members.length; i++){
        if(indivEmail.indexOf(members[i].Email) == -1){
            indivEmail.push(members[i].Email);
        }else{
            //await MemberModel.findByIdAndDelete(members[i]._id);
        }
    }
    console.log(dupeEmail);
    res.sendStatus(200);
});*/

//POST routes
router.post('/get-teams', async function(req, res){
    try{
        var TeamsRaw = await TeamModel.find({SpringfestYear: process.env.YEAR}, null, {sort: {Name: 1}});
        var Teams = [];
        for(var i=0; i<TeamsRaw.length; i++){
            var Managers = 0;
            for(var j=0; j<TeamsRaw[i].Members.length; j++){
                if(TeamsRaw[i].Members[j].Role == "manager") Managers++;
            }
            Teams.push({
                Name: TeamsRaw[i].Name,
                UUID: TeamsRaw[i].UUID,
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
router.post('/team-data/:teamuuid', async function(req, res){
    try{
        var TeamUUID = req.params.teamuuid;
        var team = await TeamModel.findOne({UUID: TeamUUID});
        var MembersPerRole = [0, 0, 0, 0, 0];
        var Roles = ['manager', 'team-leader', 'team-member', 'coach', 'designer'];
        for(var i=0; i<team.Members.length; i++){
            MembersPerRole[Roles.indexOf(team.Members[i].Role)]++;
        }
        res.status(200).send({
            TeamName: team.Name,
            Managers: MembersPerRole[0],
            TeamLeaders: MembersPerRole[1],
            TeamMembers: MembersPerRole[2],
            Coaches: MembersPerRole[3],
            Designers: MembersPerRole[4],
            TShirtColor: team.TShirtColor || "Unknown",
            TShirtHEX: team.TShirtHEX,
            TShirtTextColor: team.TShirtTextColor,
            ManagersText: team.ManagersText,
            TeamLeadersText: team.TeamLeadersText,
            TeamMembersText: team.TeamMembersText,
            CoachesText: team.CoachesText,
            DesignersText: team.DesignersText
        });
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.post('/get-members/:teamuuid', async function(req, res){
    try{
        var teamUUID = req.params.teamuuid;
        var members = [];
        var team = await TeamModel.findOne({UUID: teamUUID});
        var roles = ['manager', 'team-leader', 'team-member', 'coach', 'designer'];
        for(var j=0; j<roles.length; j++){
            for(var i=0; i<team.Members.length; i++){
                if(team.Members[i].Role == roles[j]){
                    var member = (await MemberModel.findById(team.Members[i].ID));
                    if(member){
                        members.push({
                            Fullname: member.Fullname,
                            Email: member.Email,
                            TShirtSize: member.TShirtSize,
                            UUID: member.UUID,
                            Role: team.Members[i].Role
                        });        
                    }else{
                        (team.Members).splice(i, 1);
                        await team.save();
                    }
                }
            }    
        }
        res.status(200).send(members);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
})

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
router.put('/add-member/:teamuuid', async function(req, res){
    try{
        var memberData = req.body || null;
        var teamUUID = req.params.teamuuid;
        if(memberData){
            //Check if the member is already in another team
            var member = await MemberModel.findOne({Email: memberData.Email, SpringfestYear: process.env.YEAR});
            if(!member){
                member = new MemberModel({
                    Fullname: memberData.Fullname,
                    Email: memberData.Email,
                    TShirtSize: memberData.TShirtSize,
                    UUID: uuidv4(),
                });
                await member.save();
            }
            var team = await TeamModel.findOne({UUID: teamUUID});
            var IsAlreadyInTeam = false;
            for(var i=0; i<team.Members.length; i++){
                if(team.Members[i].ID.equals(member._id)) IsAlreadyInTeam = true;
            }
            if(!IsAlreadyInTeam){
                team.Members.push({
                    ID: member._id,
                    Role: memberData.Role
                });
                await team.save();
                res.status(200).send({UUID: member.UUID});
            }else{
                res.status(401).send({Error: "Member already in team"});
            }
        }else{
            res.status(401).send({Error: "Incomplete Data"});
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/tshirt-color/:teamuuid', async function(req, res){
    try{
        var team = await TeamModel.findOneAndUpdate({UUID: req.params.teamuuid}, {TShirtColor: req.body.Color});
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/update-role', async function(req, res){
    try{
        var UserUUID = req.body?.UserUUID;
        var Role = req.body?.Role;
        var TeamUUID = req.body?.TeamUUID;
        var team = await TeamModel.findOne({UUID: TeamUUID});
        var member = await MemberModel.findOne({UUID: UserUUID});
        for(var i=0; i<team.Members.length; i++){
            if((team.Members[i].ID).equals(member._id)){
                team.Members[i].Role = Role;
                i = team.Members.length;
            }
        }
        await team.save();
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/add-members-batch/:teamUUID', async function(req, res){
    try{
        var TeamUUID = req.params.teamUUID;
        const form = new formidable.IncomingForm();
        form.multiple = false;
        form.parse(req, async function(err, fields, files){
            if(err){
                console.log(err);
                res.sendStatus(500);
            }else{
                var newFilePath = await SaveNewDataFile(files.files[0].filepath);
                if(!newFilePath) res.sendStatus(500);
                else{
                    //Extract data from file
                    var jsonData = excelToJson({sourceFile: newFilePath}).Sheet1;
                    for(var i=0; i<jsonData.length; i++){
                        var memberData = await GetMemberData(jsonData[i]);
                        await SaveNewMember(memberData, TeamUUID);
                    }
                    res.sendStatus(200);
                    fs.unlinkSync(newFilePath);
                }
            }
        });
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/temp-upload', function(req, res){
    try{
        const form = new formidable.IncomingForm();
        form.multiple = false;
        form.parse(req, async function(err, fields, files){
            if(err){
                console.log(err);
                res.sendStatus(500);
            }else{
                var newFilePath = await SaveNewDataFile(files.files[0].filepath);
                if(!newFilePath) res.sendStatus(500);
                else{
                    var jsonData = excelToJson({sourceFile: newFilePath}).Sheet1;
                    for(var i=1; i<jsonData.length; i++){
                        var memberData = {
                            Role: "team-member",
                            Email: jsonData[i].D,
                            Fullname: jsonData[i].E,
                            TShirtSize: jsonData[i].H,
                            Teams: (jsonData[i].G).split(";")
                        }
                        memberData.Teams.pop();
                        for(var j=0; j<memberData.Teams.length; j++){
                            if(memberData.Teams[j] == "Flag Ceremony") memberData.Teams[j] = "Opening Show";
                            var team = await TeamModel.findOne({Name: memberData.Teams[j]});
                            if(!team) console.log(memberData);
                            SaveNewMember(memberData, team.UUID);
                        }
                    }
                    fs.unlinkSync(newFilePath);
                }
                res.sendStatus(200);
            }
        });
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/tshirt-hex/:teamUUID', async function(req, res){
    try{
        var team = await TeamModel.findOneAndUpdate({UUID: req.params.teamUUID}, {TShirtHEX: req.body.HEXValue});
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/tshirt-text-color/:teamUUID', async function(req, res){
    try{
        var team = await TeamModel.findOneAndUpdate({UUID: req.params.teamUUID}, {TShirtTextColor: req.body.TextColor});
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/managers-text/:teamUUID', async function(req, res){
    try{
        var team = await TeamModel.findOneAndUpdate({UUID: req.params.teamUUID}, {ManagersText: req.body.ManagersText});
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/team-leaders-text/:teamUUID', async function(req, res){
    try{
        var team = await TeamModel.findOneAndUpdate({UUID: req.params.teamUUID}, {TeamLeadersText: req.body.TeamLeadersText});
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/team-members-text/:teamUUID', async function(req, res){
    try{
        var team = await TeamModel.findOneAndUpdate({UUID: req.params.teamUUID}, {TeamMembersText: req.body.TeamMembersText});
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/coaches-text/:teamUUID', async function(req, res){
    try{
        var team = await TeamModel.findOneAndUpdate({UUID: req.params.teamUUID}, {CoachesText: req.body.CoachesText});
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
router.put('/designers-text/:teamUUID', async function(req, res){
    try{
        var team = await TeamModel.findOneAndUpdate({UUID: req.params.teamUUID}, {DesignersText: req.body.DesignersText});
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

async function SaveNewDataFile(filepath){
    try{
        var UUID = uuidv4();
        fs.copyFileSync(filepath, `${homeDir}/data/${UUID}`);
        return(`${homeDir}/data/${UUID}`);
    }catch(e){
        console.log(e);
        return 0;
    }
}
async function GetMemberData(jsonData){
    return({
        Fullname: jsonData.B,
        Email: jsonData.C,
        TShirtSize: jsonData.D,
        Role: ((jsonData.A).toLowerCase()).split(" ").join("-"),
        Phone: jsonData.E || null
    });
}
async function SaveNewMember(memberData, teamUUID){
    var member = await MemberModel.findOne({Email: memberData.Email});
    if(!member){
        member = new MemberModel({
            Fullname: memberData.Fullname,
            Email: memberData.Email,
            TShirtSize: memberData.TShirtSize,
            UUID: uuidv4(),
        });
        await member.save();
    }
    var team = await TeamModel.findOne({UUID: teamUUID});
    var IsAlreadyInTeam = false;
    for(var i=0; i<team.Members.length; i++){
        if((team.Members[i].ID).equals(member._id)) IsAlreadyInTeam = true;
    }
    if(!IsAlreadyInTeam){
        team.Members.push({
            ID: member._id,
            Role: memberData.Role
        });
        await team.save();
    }
    return(0);
}


//Export router
module.exports = router;