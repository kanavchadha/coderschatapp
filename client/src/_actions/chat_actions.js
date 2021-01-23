import axios from 'axios';
import {
    GET_CHATS,
    AFTER_POST_MESSAGE,
    AFTER_DELETE_MESSAGE,
} from './types';
import { CHAT_SERVER } from '../components/Config.js';

export function getChats(){
    const request = axios.get(`${CHAT_SERVER}/getChats`).then(response => response.data);
    console.log(request);
    return {
        type: GET_CHATS,
        payload: request
    }
}

export function afterPostMessage(data){
    return {
        type: AFTER_POST_MESSAGE,
        payload: data
    }
}

export function afterDeleteMessage(data){
    return {
        type: AFTER_DELETE_MESSAGE,
        payload: data
    }
}

