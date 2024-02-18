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
        Name:{
            type: String
        },
        Email:{
            type: String
        },
        Role:{
            type: String
        },
        Phone:{
            type: String
        },
        TShirtSize:{
            type: String
        }
    }],
    SpringfestYear:{
        type: Number,
        default: process.env.YEAR
    }
});

module.exports = mongoose.model('Team', TeamSchema);