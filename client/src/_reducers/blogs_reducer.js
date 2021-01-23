import { GET_BLOGS, POST_BLOG, DELETE_BLOG, GET_BLOG_DETAILS, GET_BLOG_ID, EDIT_BLOG } from '../_actions/types';

export default function (state = { displayOP: false }, action) {
    switch (action.type) {
        case GET_BLOGS:
            return { ...state, blogs: action.payload }
        case GET_BLOG_DETAILS:
            return { ...state, blog: action.payload }
        case POST_BLOG:
            return { ...state, message: action.payload }
        case GET_BLOG_ID:
            return { ...state, message: action.payload }
        case EDIT_BLOG:
            return { ...state, message: action.payload }
        case DELETE_BLOG:
            return { ...state, message: action.payload }
        default:
            return state;
    }
}