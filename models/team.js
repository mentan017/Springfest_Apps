const mongoose = require('mongoose');
require('dotenv').config();

const TeamSchema = new mongoose.Schema({
    Name:{
        type: String
    },
    UUID:{
        type: String
    },
    Members:[{
        ID:{
            type: mongoose.Schema.Types.ObjectId
        },
        Role:{
            type: String
        },
    }],
    TShirtColor:{
        type: String,
    },
    TShirtHEX:{
        type: String,
    },
    TShirtTextColor:{
        type: String
    },
    ManagersText:{
        type: String
    },
    TeamLeadersText:{
        type: String
    },
    TeamMembersText:{
        type: String
    },
    CoachesText:{
        type: String
    },
    DesignersText:{
        type: String
    },
    SpringfestYear:{
        type: Number,
        default: process.env.YEAR
    }
});

module.exports = mongoose.model('Team', TeamSchema);