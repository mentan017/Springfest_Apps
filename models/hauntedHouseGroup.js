const mongoose = require('mongoose');

const HauntedHouseGroup = new mongoose.Schema({
    ID:{
        type: Number
    },
    Members:[{
        type: mongoose.Schema.Types.ObjectId
    }],
    GroupSize:{
        type: Number
    }
});

module.exports = mongoose.model("Haunted House Group", HauntedHouseGroup);