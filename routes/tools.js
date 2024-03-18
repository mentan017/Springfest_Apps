//Import modules
const excelToJson = require('convert-excel-to-json');
const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const handleBars = require('handlebars');
const mongoose = require('mongoose');
const path = require('path');
const { execSync } = require('child_process');
const {v4: uuidv4} = require('uuid');

//Import MongoDB models
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

//POST routes

router.post('/create-t-shirt-presentation', async function(req, res){
    try{
        //Get the file
        const form = new formidable.IncomingForm();
        form.multiple = false;
        form.parse(req, async function(err, fields, files){
            if(err){
                console.log(err);
                res.sendStatus(500);
            }else{
                //Save File
                var newFilePath = await SaveNewDataFile(files.files[0].filepath);
                if(!newFilePath) res.sendStatus(500);
                else{
                    //Convert Excel to JSON
                    var slides = [];
                    var jsonData = excelToJson({sourceFile: newFilePath}).Sheet1;
                    for(var i=1; i<jsonData.length; i++){
                        var teamData = await GetTShirtData(jsonData[i]);
                        var roleExists = [true, true, teamData.textTeamLeader || 0, teamData.textCoach || 0];
                        for(var j=0; j<roleExists.length; j++){
                            if(roleExists[j]) slides.push(await CreateSlideNew(teamData, j));
                        }
                    }
                    var presentation = await CreatePresentation(slides, newFilePath);
                    if(presentation) res.sendStatus(200);
                }
            }
        });
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

//New T-Shirt presentation route
router.get('/t-shirt-presentation', async function(req, res){
    try{
        var roles = ['manager', 'team-leader', 'team-member', 'coach', 'designer'];
        var priorityTeams = ['it', 'costume', 'lights','sports', 'stunt', 'gym', 'acting', 'makeup', 'steward', 'crew'];
        var sizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
        //Get all members
        var teams = await TeamModel.find({});
        var membersRaw = [];
        var members = [];
        var memberIndex;
        var teamData = [];
        for(var i=0; i<teams.length; i++){
            teamData.push({
                TeamName: teams[i].Name,
                ColorName: teams[i].TShirtColor,
                HEXValue: teams[i].TShirtHEX,
                TextColor: teams[i].TShirtTextColor,
                rolesExistance: [0, 0, 0, 0, 0],
                rolesText: [teams[i].ManagersText || `${teams[i].Name} Manager`, 
                teams[i].TeamLeadersText || `${teams[i].Name} Team Leader`,
                teams[i].TeamMembersText || `${teams[i].Name}`,
                teams[i].CoachesText || `${teams[i].Name} Coach`,
                teams[i].DesignersText || `${teams[i].Name} Designer`],
                sizes: [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]]
            });
            for(var j=0; j<teams[i].Members.length; j++){
                var memberText = "";
                switch (teams[i].Members[j].Role) {
                    case 'manager':
                        memberText = teams[i].ManagersText;
                        break;
                    case 'team-leader':
                        memberText = teams[i].TeamLeadersText;
                        break;
                    case 'team-member':
                        memberText = teams[i].TeamMembersText;
                        break;
                    case 'coach':
                        memberText = teams[i].CoachesText;
                        break;
                    case 'designer':
                        memberText = teams[i].DesignersText;
                        break;
                }
                if(memberText != "none"){
                    memberIndex = membersRaw.indexOf((teams[i].Members[j].ID).toString());
                    if(memberIndex == -1){
                        membersRaw.push((teams[i].Members[j].ID).toString());
                        var member = await MemberModel.findById(teams[i].Members[j].ID);
                        members.push({
                            Role: teams[i].Members[j].Role,
                            TShirtSize: member.TShirtSize,
                            Team: teams[i].Name
                        });
                    }else{
                        //TODO check for bugs
                        //Check if role is more important
                        if(roles.indexOf(teams[i].Members[j].Role) < roles.indexOf(members[memberIndex].Role)){
                            members[memberIndex].Role = teams[i].Members[j].Role;
                            members[memberIndex].Team = teams[i].Name;
                        }
                        //Check if team has priority
                        else if((roles.indexOf(teams[i].Members[j].Role) == roles.indexOf(members[memberIndex].Role)) && (priorityTeams.indexOf((teams[i].Name.toLowerCase())) > priorityTeams.indexOf((members[memberIndex].Team).toLowerCase()))){
                            members[memberIndex].Team = teams[i].Name;
                        }
                    }
                }
            }
        }
        var slides = [];
        for(var i=0; i<members.length; i++){
            for(var j=0; j<teams.length; j++){
                if(members[i].Team == teams[j].Name){
                    teamData[j].rolesExistance[(roles.indexOf(members[i].Role))] = 1;
                    teamData[j].sizes[(roles.indexOf(members[i].Role))][(sizes.indexOf(members[i].TShirtSize))]++;
                    j=teams.length;
                }
            }
        }
        for(var i=0; i<teamData.length; i++){
            for(var j=0; j<(teamData[i].rolesExistance).length; j++){
                if(teamData[i].rolesExistance[j]) slides.push(await NewCreateSlide(teamData[i], j));
            }
        }
        execSync('touch temp.txt');
        var presentation = await CreatePresentation(slides, 'temp.txt');
        console.log("Done");
        res.sendStatus(200);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

async function NewCreateSlide(teamData, index){
    var roles = ['Manager', 'Team Leader', 'Team Member', 'Coach', 'Designer'];
    var teamName = (teamData.TeamName).split("&").join("\\&");
    var TShirtFile = `t-shirt-${((teamData.ColorName).toLowerCase()).split(" ").join("-")}-${((teamData.TeamName).split(" ").join("").split("&").join("-")).toLowerCase()}-${(roles[index].split(" ").join("-")).toLowerCase()}.png`;
    await CreateTShirtImage(teamData.HEXValue, ((teamData.ColorName).toLowerCase()).split(" ").join("-"), teamData.TextColor, teamData.rolesText[index], (roles[index].split(" ").join("-")).toLowerCase(), ((teamData.TeamName).split(" ").join("").split("&").join("-")).toLowerCase());
    var slideSource = fs.readFileSync(`${homeDir}/resources/t-shirt-presentation-slide-template.txt`, 'utf8');
    var slideTemplate = handleBars.compile(slideSource);
    var slide = slideTemplate({
        teamName: teamName,
        role: roles[index],
        originalColorName: teamData.ColorName,
        textColor: teamData.TextColor,
        text: (teamData.rolesText[index]).split("&").join("\\&"),
        TShirtFile: TShirtFile,
        XXS: (teamData.sizes[index][0]).toString(),
        XS: (teamData.sizes[index][1]).toString(),
        S: (teamData.sizes[index][2]).toString(),
        M: (teamData.sizes[index][3]).toString(),
        L: (teamData.sizes[index][4]).toString(),
        XL: (teamData.sizes[index][5]).toString(),
        XXL: (teamData.sizes[index][6]).toString()
    });
    return slide.split("amp;").join("");
}

//Additional functions

async function CreatePresentation(slides, newFilePath){
    var presentation = `
    \\documentclass{beamer}
    
    \\usepackage{graphicx}
    \\graphicspath{ {./t_shirts/} }
    
    \\usetheme{Singapore}
    %\\usecolortheme{whale}
    
    \\title{T-Shirts Order for \\\\European School of Brussels III}
    \\date{${process.env.YEAR}}
    
    \\begin{document}
    \\maketitle
    ${slides.join("\n")}
    \\end{document}`;
    var ClientFiles = fs.readdirSync(`${homeDir}/Client/files`);
    var tShirtImgs= [];
    for(var i=0; i<ClientFiles.length; i++){
        if(ClientFiles[i].indexOf("t-shirt") != -1) tShirtImgs.push(ClientFiles[i]);
    }
    //Create the presentation file
    execSync(`cd ${homeDir}/Client/files/ ; touch presentation.tex`);
    fs.writeFileSync(`${homeDir}/Client/files/presentation.tex`, presentation);
    execSync(`cd ${homeDir}/Client/files/ ; pdflatex presentation.tex ; mv presentation.pdf T_Shirt_Order_Springfest.pdf; mkdir T_Shirt_Order ; cd T_Shirt_Order ; mkdir t_shirts ; cd .. ; mv ${tShirtImgs.join(" ")} T_Shirt_Order/t_shirts ; mv presentation.tex T_Shirt_Order ; zip -r TShirtOrder T_Shirt_Order ; rm t-shirt*.png presentation.* ; rm -rf T_Shirt_Order`);
    execSync(`rm ${newFilePath}`);
    return true;
}
async function CreateSlideNew(teamData, index){
    var roles = ['Manager', 'Member', 'Team Leader', 'Coach', 'Designer'];
    var textVariables = [teamData.textManagers, teamData.textTeam, teamData.textTeamLeader, teamData.textCoach];
    var teamName = (teamData.teamName).split("&").join("\\&");
    var TShirtFile = `t-shirt-${teamData.colorName}-${(roles[index].split(" ").join("-")).toLowerCase()}.png`;
    //Create the T-shirt
    await CreateTShirtImage(teamData.hexValue, teamData.colorName, teamData.textColor, textVariables[index], (roles[index].split(" ").join("-")).toLowerCase());
    //Create the slide from template
    var text = textVariables[index].split("&").join("\\&");
    var slideSource = fs.readFileSync(`${homeDir}/resources/t-shirt-presentation-slide-template.txt`, 'utf8');
    var slideTemplate = handleBars.compile(slideSource);
    var slide = slideTemplate({
        teamName: teamName,
        role: roles[index],
        originalColorName: teamData.originalColorName,
        textColor: teamData.textColor,
        text: text,
        TShirtFile: TShirtFile
    });
    return slide;
}
async function CreateTShirtImage(hexValue, colorName, textColor, text, position, teamName){
    execSync(`convert -size 626x417 xc:${hexValue} ${homeDir}/Client/files/${colorName}.png`);
    execSync(`magick -gravity center -background none -fill ${textColor} -size 150x80 caption:"${text}" temp.png`);
    execSync(`convert -page +0+0 ${homeDir}/Client/files/${colorName}.png -page +0+0 ${homeDir}/resources/t-shirt-template.png -page +190+135 ${homeDir}/resources/logo_${textColor}_no_bg_40.png -page +390+120 ${homeDir}/temp.png -background none -layers merge +repage ${homeDir}/Client/files/t-shirt-${colorName}-${teamName}-${position}.png`)
    execSync(`rm ${homeDir}/Client/files/${colorName}.png ; rm temp.png`);
    return(`t-shirt-${colorName}-${teamName}-${position}.png`)
}
async function GetTShirtData(jsonData){
    var data = {
        teamName: jsonData.A,
        originalColorName: jsonData.B,
        hexValue: jsonData.C,
        textColor: jsonData.D,
        textManagers: jsonData.E || `${jsonData.A} Manager`,
        textTeamLeader: jsonData.F,
        textTeam: jsonData.G || `${jsonData.A}`,
        textCoach: jsonData.H,
        colorName: ((jsonData.B).toLowerCase()).split(" ").join("-")
    }
    return data;
}
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

//Export router
module.exports = router;