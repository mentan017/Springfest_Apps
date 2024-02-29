const mongoose = require('mongoose');
require('dotenv').config();

const MemberSchema = new mongoose.Schema({
    Fullname:{
        type: String
    },
    Email:{
        type: String
    },
    TShirtSize:{
        type: String
    },
    Phone:{
        type: String
    },
    UUID:{
        type: String
    },
    SpringfestYear:{
        type: Number,
        default: process.env.YEAR
    }
});

module.exports = mongoose.model('Member', MemberSchema);