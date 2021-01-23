import axios from 'axios';
import { GET_BLOGS, POST_BLOG, GET_BLOG_DETAILS, GET_BLOG_ID, EDIT_BLOG, DELETE_BLOG } from './types';

export const createBlog = (data) => {
    const response = axios.post('/api/blog/createBlog', data).then(response=>response.data);
    return {
        type: POST_BLOG,
        payload: response
    }
}

export const getBlogs = () => {
    const response = axios.get('/api/blog/getBlogs').then(response=>response.data);
    return {
        type: GET_BLOGS,
        payload: response
    }
}

export const getBlogDetails = (blogSlug) => {
    const response = axios.get('/api/blog/getBlog/'+blogSlug).then(response=>response.data)
    return {
        type: GET_BLOG_DETAILS,
        payload: response
    }
}

export const getBlogById = (blogId) => {
    const response = axios.get('/api/blog/getblogbyid/'+blogId).then(response=>response.data)
    return {
        type: GET_BLOG_ID,
        payload: response
    }
}

export const editBlog = (id, data) => {
    const response = axios.put('/api/blog/editBlog',{id, data}).then(response=>response.data)
    return {
        type: EDIT_BLOG,
        payload: response
    }
}

export const deleteBlog = (id) => {
    const response = axios.delete('/api/blog/removeBlog/'+id).then(response=>response.data)
    return {
        type: DELETE_BLOG,
        payload: response
    }
}