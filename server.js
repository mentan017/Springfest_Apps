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
    execSync(`convert -size 626x417 xc:${hex} ./Client/files/${color}.png`);
    execSync(`convert -page +0+0 ./Client/files/${color}.png -page +0+0 ./resources/t-shirt-template.png -background none -layers merge +repage ./Client/files/t-shirt-${color}.png`)
    execSync(`rm ./Client/files/${color}.png `);
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
                        for(var i=0; i<data.length; i++){
                            var colorName = data[i].A.toLowerCase();
                            colorName = colorName.split(" ").join("-");
                            //console.log(`convert -size 626x417 xc:${data[i].B} ./Client/files/${colorName}.png`);
                            execSync(`convert -size 626x417 xc:${data[i].B} ./Client/files/${colorName}.png`);
                            execSync(`convert -page +0+0 ./Client/files/${colorName}.png -page +0+0 ./resources/t-shirt-template.png -background none -layers merge +repage ./Client/files/t-shirt-${colorName}.png`)
                            execSync(`rm ./Client/files/${colorName}.png `);
                            names.push(`t-shirt-${colorName}.png`);
                        }
                        execSync(`cd ./Client/files/ ; mkdir t_shirts ; mv -t t_shirts ${names.join(" ")}`)
                        execSync(`cd ./Client/files/ ; zip ${UUID} -r t_shirts`);
                        execSync(`cd ./Client/files/ ; rm -rf t_shirts`);
                        execSync(`rm ./data/${UUID}`);
                        res.status(200).send({UUID: UUID});
                    }
                });
            }
        })
    }catch(e){
        console.log(e);
    }
});

//Start server
app.listen(process.env.PORT);
console.log(`Springfest Apps listening on port: ${process.env.PORT}`);