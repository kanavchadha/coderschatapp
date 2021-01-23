const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        min: 3,
        max: 160,
        required: [true,'You have to provide title']
    },
    slug: {
        type: String,
        unique: true,
        index: true
    },
    content: {
        type: String,
        required: [true,'You have to provide content'],
        min: 200,
        max: 2000000
    },
    photo: {
        data: Buffer,
        contentType: String
    },
    categories: [{ type: ObjectId, ref: 'Category', required: [true,'You have to provide categories'] }],
    tags: [{ type: ObjectId, ref: 'Tag', required: [true,'You have to provide tags'] }],
    author: {
        type: ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Blog', blogSchema);