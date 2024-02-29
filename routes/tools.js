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
    //Create the presentation file
    execSync(`cd ${homeDir}/Client/files/ ; touch presentation.tex`);
    fs.writeFileSync(`${homeDir}/Client/files/presentation.tex`, presentation);
    //Remove all the temporary files used
    execSync(`cd ${homeDir}/Client/files/ ; pdflatex presentation.tex ; mv presentation.pdf T_Shirt_Order_Springfest.pdf; rm t-shirt*.png presentation.*`);
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
async function CreateTShirtImage(hexValue, colorName, textColor, text, position){
    execSync(`convert -size 626x417 xc:${hexValue} ${homeDir}/Client/files/${colorName}.png`);
    execSync(`magick -gravity center -background none -fill ${textColor} -size 150x80 caption:"${text}" temp.png`);
    execSync(`convert -page +0+0 ${homeDir}/Client/files/${colorName}.png -page +0+0 ${homeDir}/resources/t-shirt-template.png -page +190+135 ${homeDir}/resources/logo_${textColor}_no_bg_40.png -page +390+120 ${homeDir}/temp.png -background none -layers merge +repage ${homeDir}/Client/files/t-shirt-${colorName}-${position}.png`)
    execSync(`rm ${homeDir}/Client/files/${colorName}.png ; rm temp.png`);
    return(`t-shirt-${colorName}-${position}.png`)
}
async function GetTShirtData(jsonData){
    var data = {
        teamName: jsonData.A,
        originalColorName: jsonData.B,
        hexValue: jsonData.C,
        textColor: jsonData.D,
        textManagers: jsonData.E || `${jsonData.A} Manager`,
        textTeamLeader: jsonData.F,
        textTeam: jsonData.G || `${jsonData.A} Team`,
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