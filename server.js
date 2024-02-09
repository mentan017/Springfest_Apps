//Import node modules
const express = require('express');
const excelToJson = require('convert-excel-to-json');
const formidable = require('formidable');
const fs = require('fs');
const { execSync } = require('child_process');
const {v4: uuidv4} = require('uuid');
require('dotenv').config();

//Global variables
const app = express();
const homeDir = __dirname

//Server config
app.use(express.static(__dirname + '/Client'));
app.use(express.json());


//GET routes
app.get('/', function(req, res){
    res.status(200).sendFile(`${homeDir}/Client/Home/index.html`);
});
app.get('/create-t-shirt', function(req, res){
    res.status(200).sendFile(`${homeDir}/Client/Create_T_Shirts/index.html`);
});
app.get('/download/:file', function(req, res){
    res.status(200).download(`${homeDir}/Client/files/${req.params.file}`);
});

//POST routes
app.post('/create-t-shirt', async function(req, res){
    var color = req.body.Color;
    var hex = req.body.HEX;

    var textColor = "black";

    var hexLess = hex.substring(1);
    var rgb = parseInt(hexLess, 16);
    var r = (rgb >> 16) & 0xff;
    var g = (rgb >> 8) & 0xff;
    var b = (rgb >> 0) & 0xff;
    var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if(luma < 40){
        textColor = "white";
    }
    
    execSync(`convert -size 626x417 xc:${hex} ./Client/files/${color}.png`);
    execSync(`magick -gravity center -background none -fill ${textColor} -size 150x80 caption:"Haunted House Manager" new_temp.png`);
    execSync(`convert -page +0+0 ./Client/files/${color}.png -page +0+0 ./resources/t-shirt-template.png -page +190+135 ./resources/logo_${textColor}_no_bg_40.png -page +390+120 ./new_temp.png -background none -layers merge +repage ./Client/files/t-shirt-${color}.png`)
    execSync(`rm ./Client/files/${color}.png ; rm new_temp.png`);
    res.sendStatus(200);
});

app.post('/create-t-shirt-presentation', async function(req, res){
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
async function CreateSlideNew(teamData, index){
    var roles = ['Manager', 'Member', 'Team Leader', 'Coach'];
    var textVariables = [teamData.textManagers, teamData.textTeam, teamData.textTeamLeader, teamData.textCoach];
    var teamName = (teamData.teamName).split("&").join("\\&");
    var TShirtFile = `t-shirt-${teamData.colorName}-${(roles[index].split(" ").join("-")).toLowerCase()}.png`;
    //Create the T-shirt
    await CreateTShirtImage(teamData.hexValue, teamData.colorName, teamData.textColor, textVariables[index], (roles[index].split(" ").join("-")).toLowerCase());
    //Create the slide
    var text = textVariables[index].split("&").join("\\&");
    var slide = `
    \\begin{frame}
    
    \\frametitle{\\textbf{${teamName} ${roles[index]}}}
    
    \\begin{columns}[T]
    
    \\begin{column}{0.40\\textwidth}
    
    \\textbf{Color:} ${teamData.originalColorName}\\\\
    \\textbf{Text Color:} ${teamData.textColor}\\\\
    \\textbf{Back Text:} ${text}\\\\
    \\textbf{Amount:} \\\\
    \\begin{itemize}
    \\item[-] XXS:
    \\item[-] XS:
    \\item[-] S:
    \\item[-] M:
    \\item[-] L:
    \\item[-] XL:
    \\item[-] XXL:
    \\item[-] 3XL:
    \\end{itemize}
    
    \\end{column}
    
    \\begin{column}{0.50\\textwidth}
    \\includegraphics[width=\\textwidth]{ ${TShirtFile} }
    \\end{column}
    
    \\end{columns}
    
    \\end{frame}`;
    return slide;
}
async function CreatePresentation(slides, newFilePath){
    var presentation = `
    \\documentclass{beamer}
    
    \\usepackage{graphicx}
    \\graphicspath{ {./t_shirts/} }
    
    \\usetheme{Singapore}
    %\\usecolortheme{whale}
    
    \\title{T-Shirts Order for \\\\European School of Brussels III}
    \\date{2024}
    
    \\begin{document}
    \\maketitle
    ${slides.join("\n")}
    \\end{document}`;
    //Create the presentation file
    execSync(`cd ./Client/files/ ; touch presentation.tex`);
    fs.writeFileSync('./Client/files/presentation.tex', presentation);
    execSync(`cd ./Client/files/ ; pdflatex presentation.tex ; mv presentation.pdf T_Shirt_Order_Springfest.pdf; rm t-shirt*.png presentation.*`);
    execSync(`rm ${newFilePath}`);
    return true;
}
async function CreateTShirtImage(hexValue, colorName, textColor, text, position){
    execSync(`convert -size 626x417 xc:${hexValue} ./Client/files/${colorName}.png`);
    execSync(`magick -gravity center -background none -fill ${textColor} -size 150x80 caption:"${text}" temp.png`);
    execSync(`convert -page +0+0 ./Client/files/${colorName}.png -page +0+0 ./resources/t-shirt-template.png -page +190+135 ./resources/logo_${textColor}_no_bg_40.png -page +390+120 ./temp.png -background none -layers merge +repage ./Client/files/t-shirt-${colorName}-${position}.png`)
    execSync(`rm ./Client/files/${colorName}.png ; rm temp.png`);
    return(`t-shirt-${colorName}-${position}.png`)
}

//Start server
app.listen(process.env.PORT);
console.log(`Springfest Apps listening on port: ${process.env.PORT}`);