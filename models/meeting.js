const mongoose = require('mongoose');
require('dotenv').config();

const MeetingSchema = new mongoose.Schema({
    MeetingType:{
        type: String,
    },
    DateShort:{
        type: String,
    },
    DateStr:{
        type: String,
    },
    Room:{
        type: String
    },
    DiscussionPoints:[{
        Point:{
            type: String
        },
        Progress:{ //0 for "Undone", 1 for "In Progress", 2 for "Done"
            type: Number
        }
    }],
    Notes:{
        type: String,
        default: ""
    },
    UUID:{
        type: String
    },
    SpringfestYear:{
        type: Number,
        default: process.env.YEAR
    }
});

module.exports = mongoose.model('Meeting', MeetingSchema);