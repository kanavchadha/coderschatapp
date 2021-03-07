const mongoose = require('mongoose');

const storySchema = mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    caption: {
        type: String,
        default: ''
    },
    publicId: String,
    type: {
        type: String,
        default: 'image'
    },
}, { timestamps: true });

const Story = mongoose.model('Story', storySchema);
module.exports = { Story }