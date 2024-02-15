const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
    MeetingType:{
        type: String,
    },
    DateStr:{
        type: String,
    },
    Room:{
        type: String
    },
    UUID:{
        type: String
    },
    SpringfestYear:{
        type: Number
    }
});

module.exports = mongoose.model('Meeting', MeetingSchema);