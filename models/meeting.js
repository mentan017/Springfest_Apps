const mongoose = require('mongoose');

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
    UUID:{
        type: String
    },
    SpringfestYear:{
        type: Number
    }
});

module.exports = mongoose.model('Meeting', MeetingSchema);