//Import node modules
const excel = require('excel4node');
const express = require('express');
const fs = require('fs');
const https = require('https');
const mongoose = require('mongoose');
require('dotenv').config();

//Import routes
const MeetingsRouter = require('./routes/meetings.js');
const TeamsRouter = require('./routes/teams.js');
const ToolsRouter = require('./routes/tools.js');

//Import MongoDB models
const MemberModel = require('./models/member.js');
const TeamModel = require('./models/team.js');

//Import the SSL certificate
const sslOptions = {
    key: fs.readFileSync('./cert/server.key'),
    cert: fs.readFileSync('./cert/server.crt')
};

//Global variables
const app = express();
const server = https.createServer(sslOptions, app);
const homeDir = __dirname;

//Server config
app.use(express.static(__dirname + '/Client'));
app.use(express.json());

//Connect to MongoDB database
mongoose.set("strictQuery", false);
mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.PROJECT_NAME}`);
var db = mongoose.connection;

//GET routes
app.get('/', function(req, res){
    res.status(200).sendFile(`${homeDir}/Client/Home/index.html`);
});
app.get('/download/:file', function(req, res){
    try{
        res.status(200).download(`${homeDir}/Client/files/${req.params.file}`);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
app.get('/create-teams-excels', async function(req, res){
    var wb = new excel.Workbook();
    var teams = await TeamModel.find({});
    var roles = ['manager', 'team-leader', 'team-member', 'coach', 'designer'];
    for(var i=0; i<teams.length; i++){
        var members = [];
        var ws = wb.addWorksheet(teams[i].Name);
        ws.cell(1, 1).string("Role");
        ws.cell(1, 2).string("Name");
        ws.cell(1, 3).string("Email");
        ws.cell(1, 4).string("T-Shirt Size");
        for(var j=0; j<roles.length; j++){
            for(var k=0; k<teams[i].Members.length; k++){
                if(teams[i].Members[k].Role == roles[j]){
                    var member = await MemberModel.findById(teams[i].Members[k].ID);
                    members.push({
                        Fullname: member.Fullname,
                        Email: member.Email,
                        TShirtSize: member.TShirtSize,
                        Role: (roles[j]).split("-").join(" ")
                    });
                }
            }
        }
        for(var j=0; j<members.length; j++){
            ws.cell(2+j, 1).string(members[j].Role);
            ws.cell(2+j, 2).string(members[j].Fullname);
            ws.cell(2+j, 3).string(members[j].Email);
            ws.cell(2+j, 4).string(members[j].TShirtSize);
        }
    }
    wb.write('./data/sf24_teams.xlsx');
    res.sendStatus(200);
});
app.get('/duplicates', async function(req, res){
    var members = await MemberModel.find({});
    var indivEmail = [];
    var dupeEmail = [];
    for(var i=0; i<members.length; i++){
        if(indivEmail.indexOf(members[i].Email) == -1){
            indivEmail.push(members[i].Email);
        }else{
            dupeEmail.push(members[i].Email);
            //await MemberModel.findByIdAndDelete(members[i]._id);
        }
    }
    console.log(dupeEmail);
    res.sendStatus(200);
});
//POST routes

//Connect routes
app.use('/meetings', MeetingsRouter);
app.use('/teams', TeamsRouter);
app.use('/tools', ToolsRouter);

//Start server
server.listen(process.env.PORT);
console.log(`${process.env.PROJECT_NAME} listening on port: ${process.env.PORT}`);