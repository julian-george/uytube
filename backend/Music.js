const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
    id: String,
    data: Object,
    created: { type: Date, default: Date.now },
    //editable intended to be a future feature to change editing access of file
    editable: { type: Boolean, default: true},
})

const Music = mongoose.model('Music',musicSchema)

module.exports = Music
