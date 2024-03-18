const excelToJson = require('convert-excel-to-json');
const mongoose = require('mongoose');

//Import MongoDB models
const ReservationUserModel = require('./models/reservationUser.js');
const HauntedHouseGroupModel = require('./models/hauntedHouseGroup.js');

//Connect to MongoDB
mongoose.set("strictQuery", false);
mongoose.connect(`mongodb://127.0.0.1:27017/SF24ReservationsTest`);
var db = mongoose.connection;

async function CreateGroups(){
    await ReservationUserModel.collection.drop();
    await HauntedHouseGroupModel.collection.drop();
    var index = 0;
    var jsonData = excelToJson({sourceFile: `/home/mentan017/Downloads/Reservations.xlsx`});
    var rawData = jsonData.in;
    for(var i=1; i<rawData.length; i++){
        var members = [];
        if(rawData[i].A){
            if(!(await ReservationUserModel.findOne({Email: rawData[i].A}))) members.push(rawData[i].A);
        }
        if(rawData[i].B){
            if(!(await ReservationUserModel.findOne({Email: rawData[i].B}))) members.push(rawData[i].B);
        }
        if(rawData[i].C){
            if(!(await ReservationUserModel.findOne({Email: rawData[i].C}))) members.push(rawData[i].C);
        }
        if(rawData[i].D){
            if(!(await ReservationUserModel.findOne({Email: rawData[i].D}))) members.push(rawData[i].D);
        }
        if(members.length > 0){
            index++;
            var NewGroup = new HauntedHouseGroupModel({
                ID: index,
                GroupSize: members.length,
                Members: []
            });
            await NewGroup.save();
            for(var j=0; j<members.length; j++){
                var NewUser = new ReservationUserModel({
                    Email: members[j],
                    HauntedHouseGroup: NewGroup._id
                });
                await NewUser.save();
                NewGroup.Members.push(NewUser._id);
                await NewGroup.save();
            }
        }
    }
    await Merge3And1Groups();
    await Merge2And2Groups();
    await Merge2And1Groups();
    await Merge3And1Groups();
    await Merge1Groups();
    console.log("Done!")
}

async function Merge3And1Groups(){
    var ThreeMembersGroups = await HauntedHouseGroupModel.find({GroupSize: 3});
    var OneMemberGroups = await HauntedHouseGroupModel.find({GroupSize: 1});
    for(var i=0; i<ThreeMembersGroups.length; i++){
        if(OneMemberGroups[i]){
            var LoneMember = OneMemberGroups[i].Members[0];
            ThreeMembersGroups[i].Members.push(LoneMember);
            ThreeMembersGroups[i].GroupSize = 4;
            await ThreeMembersGroups[i].save();
            await HauntedHouseGroupModel.findByIdAndDelete(OneMemberGroups[i]._id);
            await ReservationUserModel.findByIdAndUpdate(LoneMember, {HauntedHouseGroup: ThreeMembersGroups._id});
        }
    }
}
async function Merge2And2Groups(){
    var TwoMembersGroups = await HauntedHouseGroupModel.find({GroupSize: 2});
    for(var i=0; i<TwoMembersGroups; i+2){
        if(TwoMembersGroups[i+1]){
            TwoMembersGroups[i].Members.push(TwoMembersGroups[i+1].Members[0]);
            TwoMembersGroups[i].Members.push(TwoMembersGroups[i+1].Members[1]);
            await TwoMembersGroups[i].save();
            await HauntedHouseGroupModel.findByIdAndDelete(TwoMembersGroups[i+1]._id);
            await ReservationUserModel.findByIdAndUpdate(TwoMembersGroups[i].Members[2], {HauntedHouseGroup: TwoMembersGroups[i]._id});
            await ReservationUserModel.findByIdAndUpdate(TwoMembersGroups[i].Members[3], {HauntedHouseGroup: TwoMembersGroups[i]._id});
        }
    }
}
async function Merge2And1Groups(){
    var TwoMembersGroups = await HauntedHouseGroupModel.find({GroupSize: 2});
    var OneMemberGroups = await HauntedHouseGroupModel.find({GroupSize: 1});
    for(var i=0; i<TwoMembersGroups.length; i++){
        if(OneMemberGroups[i]){
            var LoneMember = OneMemberGroups[i].Members[0];
            TwoMembersGroups[i].Members.push(LoneMember);
            TwoMembersGroups[i].GroupSize = 4;
            await TwoMembersGroups[i].save();
            await HauntedHouseGroupModel.findByIdAndDelete(OneMemberGroups[i]._id);
            await ReservationUserModel.findByIdAndUpdate(LoneMember, {HauntedHouseGroup: TwoMembersGroups._id});
        }
    }
}
async function Merge1Groups(){
    var OneMemberGroups = await HauntedHouseGroupModel.find({GroupSize: 1});
    for(var i=0; i<OneMemberGroups.length; i+4){
        OneMemberGroups[i].Members.push(OneMemberGroups[i+1].Members[0]);
        OneMemberGroups[i].Members.push(OneMemberGroups[i+2].Members[0]);
        OneMemberGroups[i].Members.push(OneMemberGroups[i+3].Members[0]);
        await OneMemberGroups[i].save();
        await HauntedHouseGroupModel.findByIdAndDelete(OneMemberGroups[i+1]._id);
        await HauntedHouseGroupModel.findByIdAndDelete(OneMemberGroups[i+2]._id);
        await HauntedHouseGroupModel.findByIdAndDelete(OneMemberGroups[i+3]._id);
        await ReservationUserModel.findByIdAndUpdate(OneMemberGroups[i].Members[1], {HauntedHouseGroup: OneMemberGroups[i]._id});
        await ReservationUserModel.findByIdAndUpdate(OneMemberGroups[i].Members[2], {HauntedHouseGroup: OneMemberGroups[i]._id});
        await ReservationUserModel.findByIdAndUpdate(OneMemberGroups[i].Members[3], {HauntedHouseGroup: OneMemberGroups[i]._id});
    }
}

CreateGroups();

