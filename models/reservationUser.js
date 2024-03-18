const mongoose = require('mongoose');

const ReservationUserSchema = new mongoose.Schema({
    Email: {
        type: String
    },
    HauntedHouseGroup:{
        type: mongoose.Schema.Types.ObjectId
    }
});

module.exports = mongoose.model('Reservation User', ReservationUserSchema)