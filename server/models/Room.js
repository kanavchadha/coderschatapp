const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {User} = require('./User');

const roomSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name of the Room is required."]
    },
    logo: {type: String },
    description: {type: String, default: 'Welcome to Room!'},
    members: [{
        member: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, "User Not Found!"]
        },
        role: { type: Number, default: 0}
    }]

}, { timestamps: true });

roomSchema.pre('remove',function(next){
    const room = this;
    console.log(room);
    room.members.forEach(async (m) => {
        let user = await User.findById(m.member);
        user.myRooms.pull(room._id)
        await user.save();
    });
    next();
})


const Room = mongoose.model('Room', roomSchema);
module.exports = { Room }

// roomSchema.virtual('chats',{
//     ref: 'Chat', // this tells Mongoose which model to populate documents from.
//     localField: '_id', // Mongoose will populate documents from the model in ref whose foreignField matches this document's localField.
//     foreignField: 'room'
// })
// When you `populate()` the `chats` virtual, Mongoose will find the
// first document in the Chat model whose `room` matches this document's
// `_id` property.