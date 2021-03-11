import {
    GET_CHATS,
    GET_ROOMS,
    AFTER_POST_MESSAGE,
    AFTER_DELETE_MESSAGE,
    ADD_ROOM,
    UPDATE_ROOM,
    DELETE_ROOM,
    ADD_MEMBER,
    REMOVE_MEMBER
} from '../_actions/types';

export default function (state = { rooms: {}, chats: [], displayOP: false }, action) {
    switch (action.type) {
        case GET_ROOMS:
            console.log("Getting Rooms...");
            return { ...state, rooms: action.payload }
        case GET_CHATS:
            return { ...state, chats: action.payload }
        case ADD_ROOM:
            return {
                ...state,
                rooms: state.rooms.concat(action.payload)
            }
        case UPDATE_ROOM:
            return {
                ...state,
                rooms: state.rooms.map(ur => {
                    if (ur._id === action.payload._id) {
                        return { ...ur, name: action.payload.name, logo: action.payload.logo, description: action.payload.description }
                    }
                    return { ...ur };
                })
            }
        case DELETE_ROOM:
            return { ...state, rooms: state.rooms.filter(room => room._id !== action.payload._id) }

        case ADD_MEMBER:
            const currRoom = state.rooms.find(cr => cr._id === action.payload._id);
            console.log(currRoom);
            let membArr = [];
            if (currRoom) {
                membArr = [...currRoom.members];
                membArr.push({
                    role: action.payload.role,
                    member: {
                        email: action.payload.email,
                        name: action.payload.name,
                        image: action.payload.image,
                        _id: action.payload.userId
                    }
                })
            }
            return {
                ...state,
                rooms: state.rooms.map(ur => {
                    if (ur._id === action.payload._id) {
                        return { ...ur, members: membArr }
                    }
                    return { ...ur };
                })
            }
        case REMOVE_MEMBER:
            const Room = state.rooms.find(cr => cr._id === action.payload.room._id);
            let mebrsArr = [...Room.members];
            if (Room) {
                mebrsArr = mebrsArr.filter((m) => m.member._id !== action.payload.userId)
            }
            return {
                ...state,
                rooms: state.rooms.map(ur => {
                    if (ur._id === action.payload.room._id) {
                        return { ...ur, members: mebrsArr }
                    }
                    return { ...ur };
                })
            }

        case AFTER_POST_MESSAGE:
            return { ...state, chats: state.chats.concat(action.payload) }
        case AFTER_DELETE_MESSAGE:
            return { ...state, chats: state.chats.filter(msg => msg._id !== action.payload) }

        default:
            return state;
    }
}