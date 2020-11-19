import {
    GET_CHATS,
    AFTER_POST_MESSAGE,
    AFTER_DELETE_MESSAGE,
    RUN_CHAT_CODE,
    CLOSE_CHAT_CODE,
} from '../_actions/types';
 
export default function(state={displayOP: false},action){
    switch(action.type){
        case GET_CHATS:
            return {...state, chats: action.payload }
        case AFTER_POST_MESSAGE:
                return {...state, chats: state.chats.concat(action.payload) }
        case AFTER_DELETE_MESSAGE:
            return {...state, chats: state.chats.filter(msg=>msg._id!==action.payload) }
  
        default:
            return state;
    }
}