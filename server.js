//Import node modules
const express = require('express');
const fs = require('fs');
const { execSync } = require('child_process');
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
app.get('/download-t-shirt/:file', function(req, res){
    res.status(200).download(`${homeDir}/Client/images/${req.params.file}`);
});

//POST routes
app.post('/create-t-shirt', async function(req, res){
    var color = req.body.Color;
    var hex = req.body.HEX;
    execSync(`convert -size 626x417 xc:${hex} ./Client/images/${color}.png`);
    execSync(`convert -page +0+0 ./Client/images/${color}.png -page +0+0 ./resources/t-shirt-template.png -background none -layers merge +repage ./Client/images/t-shirt-${color}.png`)
    execSync(`rm ./Client/images/${color}.png `);
    res.sendStatus(200);
});

//Start server
app.listen(process.env.PORT);
console.log(`Springfest Apps listening on port: ${process.env.PORT}`);