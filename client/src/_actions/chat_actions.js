import axios from 'axios';
import {
    GET_CHATS,
    GET_ROOMS,
    UPDATE_ROOM,
    DELETE_ROOM,
    AFTER_POST_MESSAGE,
    AFTER_DELETE_MESSAGE,
    ADD_MEMBER,
    REMOVE_MEMBER,
    ADD_ROOM,
} from './types';
import { CHAT_SERVER } from '../components/Config.js';

export function getChats(room){
    const request = axios.get(`${CHAT_SERVER}/getChats?room=${room}`).then(response => response.data);
    // console.log(request);
    return {
        type: GET_CHATS,
        payload: request
    }
}

export function getRooms(){
    const request = axios.get(`${CHAT_SERVER}/getRooms`).then(response => response.data);
    // console.log(request);
    return {
        type: GET_ROOMS,
        payload: request
    }
}

export function addRoom (newRoom){
    return {
        type: ADD_ROOM,
        payload: newRoom
    }
}
export function updateRoom (editRoomForm){
    return {
        type: UPDATE_ROOM,
        payload: editRoomForm
    }
}
export function deleteRoom (roomId){
    return {
        type: DELETE_ROOM,
        payload: roomId
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

export function addMember(data){
    return {
        type: ADD_MEMBER,
        payload: data
    }
}

export function removeMember(data){
    return {
        type: REMOVE_MEMBER,
        payload: data
    }
}