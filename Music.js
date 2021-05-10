const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
    id: String,
    data: Object,
    created: { type: Date, default: Date.now },
    editable: { type: Boolean, default: true},
})

const Music = mongoose.model('Music',musicSchema)

module.exports = Music
