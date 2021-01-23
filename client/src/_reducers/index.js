import { combineReducers } from 'redux';
import user from './user_reducer';
import chat from './chat_reducer';
import blogs from './blogs_reducer';

const rootReducer = combineReducers({
    user,
    chat,
    blogs
});

export default rootReducer;