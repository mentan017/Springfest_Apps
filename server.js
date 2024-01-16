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
app.post('/batch-create-t-shirt', async function(req, res){
    try{
        const form = new formidable.IncomingForm();
        form.multiple = false;
        form.parse(req, async function(err, fields, files){
            if(err){
                console.log(err);
                res.sendStatus(500);
            }else{
                var UUID = uuidv4();
                fs.copyFile(files.files[0].filepath, `${homeDir}/data/${UUID}`, async function(err){
                    if(err){
                        console.log(err);
                        res.sendStatus(500);
                    }else{
                        //Do the code
                        var jsonData = excelToJson({
                            sourceFile: `./data/${UUID}`
                        });
                        var data = jsonData.Sheet1;
                        var names = [];
                        var slides = [];
                        for(var i=1; i<data.length; i++){
                            var teamName = data[i].A;
                            var colorNameOr = data[i].B;
                            var hexValue = data[i].C;
                            var textColor = data[i].D;
                            var textManagers = data[i].E || `${teamName} Manager`;
                            var textTeamLeader = data[i].F;
                            var textTeam = data[i].G || `${teamName} Team`;
                            var textCoach = data[i].H;
                            
                            var colorName = (colorNameOr.toLowerCase()).split(" ").join("-");

                            names.push(await CreateTShirtImage(hexValue, colorName, textColor, textManagers, "manager"));
                            slides.push(await CreateSlide(teamName.split("&").join("\\&"), "manager", colorNameOr, textColor, textManagers.split("&").join("\\&"), `t-shirt-${colorName}-manager.png`));
                            names.push(await CreateTShirtImage(hexValue, colorName, textColor, textTeam, "member"));
                            slides.push(await CreateSlide(teamName.split("&").join("\\&"), "member", colorNameOr, textColor, textTeam.split("&").join("\\&"), `t-shirt-${colorName}-member.png`));
                            if(textTeamLeader){
                                names.push(await CreateTShirtImage(hexValue, colorName, textColor, textTeamLeader, "team-leader"));
                                slides.push(await CreateSlide(teamName.split("&").join("\\&"), "team leader", colorNameOr, textColor, textTeamLeader.split("&").join("\\&"), `t-shirt-${colorName}-team-leader.png`));
                            }
                            if(textCoach){
                                names.push(await CreateTShirtImage(hexValue, colorName, textColor, textCoach, "coach"));
                                slides.push(await CreateSlide(teamName.split("&").join("\\&"), "coach", colorNameOr, textColor, textCoach.split("&").join("\\&"), `t-shirt-${colorName}-coach.png`));
                            }
                        }
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
                        execSync(`cd ./Client/files/ ; mkdir t_shirts ; mv -t t_shirts ${names.join(" ")}`);
                        execSync(`cd ./Client/files/ ; touch presentation.tex`);
                        fs.writeFileSync('./Client/files/presentation.tex', presentation);
                        execSync(`cd ./Client/files/ ; pdflatex presentation.tex`);
                        execSync(`cd ./Client/files/ ; mv presentation.tex t_shirts ; mv presentation.pdf t_shirts`);
                        execSync(`cd ./Client/files/ ; zip ${UUID} -r t_shirts`);
                        execSync(`cd ./Client/files/ ; rm -rf t_shirts presentation.*`);
                        execSync(`rm ./data/${UUID}`);
                        res.status(200).send({UUID: UUID});
                    }
                });
            }
        });
    }catch(e){
        console.log(e);
    }
});

async function CreateTShirtImage(hexValue, colorName, textColor, text, position){
    execSync(`convert -size 626x417 xc:${hexValue} ./Client/files/${colorName}.png`);
    execSync(`magick -gravity center -background none -fill ${textColor} -size 150x80 caption:"${text}" temp.png`);
    execSync(`convert -page +0+0 ./Client/files/${colorName}.png -page +0+0 ./resources/t-shirt-template.png -page +190+135 ./resources/logo_${textColor}_no_bg_40.png -page +390+120 ./temp.png -background none -layers merge +repage ./Client/files/t-shirt-${colorName}-${position}.png`)
    execSync(`rm ./Client/files/${colorName}.png ; rm temp.png`);
    return(`t-shirt-${colorName}-${position}.png`)
}
async function CreateSlide(teamName, position, colorName, textColor, text, image){
    var slide = `
\\begin{frame}

\\frametitle{\\textbf{${teamName} ${position}}}

\\begin{columns}[T]

\\begin{column}{0.40\\textwidth}

\\textbf{Color:} ${colorName}\\\\
\\textbf{Text Color:} ${textColor}\\\\
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
\\includegraphics[width=\\textwidth]{ ${image} }
\\end{column}

\\end{columns}

\\end{frame}
`;
    return(slide);
}

//Start server
app.listen(process.env.PORT);
console.log(`Springfest Apps listening on port: ${process.env.PORT}`);