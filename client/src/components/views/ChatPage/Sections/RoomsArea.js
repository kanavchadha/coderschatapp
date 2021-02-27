import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getRooms, updateRoom, deleteRoom } from '../../../../_actions/chat_actions';
import RoomThread from './RoomThread';
import axios from 'axios';
import { Drawer, Button, Spin, Image, List, Avatar, message, Modal, Popconfirm, Input, Tooltip, Empty } from 'antd';
import { DeleteFilled, EditFilled, UserAddOutlined, InfoCircleOutlined, LogoutOutlined, CheckCircleTwoTone, CloseOutlined } from '@ant-design/icons';
import { CHAT_SERVER } from '../../../Config';
// import { deleteRoom } from '../../../_actions/chat_actions';
const { Search } = Input;

function RoomsArea(props) {
    const { currRoom, setCurrRoom, currUserId, currUserName, showRooms, setShowRooms, showRoomInfo, setShowRoomInfo, joinRoom, getChats, socket } = props;
    const [loading, setLoading] = useState(true);
    // const [rooms, setRooms] = useState([]);
    const [editRoomForm, setEditRoomForm] = useState({ name: '', logo: '', description: '' });
    const [showForm, setShowForm] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');

    const rooms = useSelector(state => state.chat.rooms);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getRooms()).then(async res => {
            if (await res.payload) {
                if (res.payload.length !== 0) {
                    setCurrRoom(res.payload[0]);
                    joinRoom(res.payload[0].name);
                    getChats(res.payload[0]._id);
                }
            }
            setLoading(false);
        });

    }, [])

    const showCurrRoom = (roomId) => {
        if (!rooms) return;
        const cr = rooms.find(r => r._id === roomId);
        socket.emit('disjoin-room',{name: currUserId, room: currRoom.name, newRoom: cr.name});
        setCurrRoom(cr);
        // console.log(currRoom);
        joinRoom(cr.name);
        getChats(cr._id);
        setShowRooms();
    }

    const checkAdmin = () => {
        if (!currUserId) return false;
        if (!currRoom) return false;
        const isAdmin = currRoom.members.find(rm => rm.member._id === currUserId);
        if (isAdmin && isAdmin.role === 1) { return true; }
        else { return false; }
    }

    const editRoom = () => {
        if (!currRoom) return;
        setEditRoomForm({ _id: currRoom._id, name: currRoom.name, logo: currRoom.logo, description: currRoom.description });
        setShowForm(true);
    }

    const roomEditHandler = () => {
        axios.post(`${CHAT_SERVER}/updateRoom`, editRoomForm).then(res => {
            dispatch(updateRoom(editRoomForm));
            message.success('Room Updated Successfully!');
            setShowForm(false);
            setCurrRoom({ ...currRoom, name: editRoomForm.name, logo: editRoomForm.logo, description: editRoomForm.description });
            setShowRoomInfo(false);
        }).catch(err => {
            setShowForm(false);
            message.error('Failed! ' + err.message);
        });
    }

    const roomDeleteHandler = () => {
        const roomId = currRoom._id;
        axios.post(`${CHAT_SERVER}/deleteRoom`, { id: roomId }).then(res => {
            dispatch(deleteRoom(roomId));
            message.success('Room Deleted Successfully!');
            setShowRoomInfo(false);
        }).catch(err => {
            message.error('Failed! ' + err.message);
        });

    }

    const addMemberHandler = () => {
        if (!newMemberEmail || !currRoom || !currUserId) return;
        socket.emit('Add Member', {
            room: currRoom,
            member: newMemberEmail,
            senderId: currUserId,
            senderName: currUserName
        },(err)=>{
            message.error(err);
        });
    }

    const leaveRoom = ()=>{
        if (!currUserId) return;
        if (!currRoom) return;
        socket.emit('Leave Room',{currRoom, currUserId, currUserName},(err)=>{
            message.error(err);
        });
    }

    const isOnline = (user)=>{
        if (!currRoom || !currRoom.onlineUsers) return false;
        const online = currRoom.onlineUsers.find(u => u.username === user);
        if(online) return true;
        return false;
    }

    return (
        <React.Fragment>
            <div className={`sidebar ${showRooms && 'toggleDrawer'} `}>
                <div className="sidebar__header">
                    <h2>My Rooms</h2>
                    <Button className="mobileview" onClick={setShowRooms} icon={<CloseOutlined /> } shape="circle" />
                </div>
                <div className="sidebar__body">
                    {loading ? <Spin /> :
                        <div className="allRooms">
                            {rooms ? rooms.length===0 ? <Empty style={{marginTop: '25px'}} /> : rooms.map(r => <RoomThread key={r._id} name={r.name} logo={r.logo} selectedRoom={currRoom ? currRoom.name : ''} showRoomInfo={() => showCurrRoom(r._id)} />) : ''}
                        </div>
                    }
                </div>
            </div>

            <Drawer
                title={currRoom && currRoom.name}
                width={348}
                placement="left"
                closable={true}
                onClose={() => setShowRoomInfo(false)}
                visible={showRoomInfo}
                footer={
                    <div className="footerButs">
                        <div >
                            {checkAdmin() &&
                                <Search placeholder="Email-Id"
                                    prefix={<UserAddOutlined />}
                                    suffix={
                                        <Tooltip title="Add Member">
                                            <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                                        </Tooltip>
                                    }
                                    enterButton="Add"
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                    onSearch={addMemberHandler}
                                />
                            }
                        </div>
                        <div >
                            {checkAdmin() && <React.Fragment>
                                <Popconfirm onConfirm={roomDeleteHandler} placement="leftTop" title='Are you sure?' okText="Yes" cancelText="No">
                                    <Button type="danger" icon={<DeleteFilled />} size="round" />
                                </Popconfirm>
                                <Button onClick={editRoom} type="primary" icon={<EditFilled />} size="round" />
                            </React.Fragment>
                            }
                        </div>
                    </div>
                }
            >
                {currRoom && <React.Fragment>
                    <Image height={200} src={currRoom.logo} />
                    <h5 style={{ marginTop: '6px' }}>{currRoom.description}</h5>
                    <List
                        itemLayout="horizontal"
                        dataSource={currRoom.members}
                        renderItem={rm => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar src={rm.member.image} />}
                                    title={
                                        <div className="membersList">
                                            <span>{rm.member.name} {isOnline(rm.member.email) && <CheckCircleTwoTone />} </span>
                                            <span>{rm.role===1?' ~ admin':''}</span>
                                        </div>
                                    }
                                    description={rm.member.email}
                                />
                            </List.Item>
                        )}
                    />
                    <Button icon={<LogoutOutlined />} onClick={leaveRoom} type="primary" style={{marginTop: '20px'}} danger block> Leave Room </Button>
                </React.Fragment>
                }
            </Drawer>

            <Modal title="Update Room" visible={showForm} onOk={roomEditHandler} onCancel={() => setShowForm(false)}>
                <input type="text" id="name" placeholder="Name of Room" value={editRoomForm.name} onChange={(event) => {
                    const name = event.target.value;
                    setEditRoomForm(nr => ({ ...nr, name: name }))
                }} className="room-input" required />
                <input type="text" id="logo" placeholder="Logo of Room" value={editRoomForm.logo} onChange={(event) => {
                    const logo = event.target.value;
                    setEditRoomForm(nr => ({ ...nr, logo: logo }))
                }} className="room-input" required />
                <input type="text" id="description" placeholder="Description of Room" value={editRoomForm.description} onChange={(event) => {
                    const descp = event.target.value;
                    setEditRoomForm(nr => ({ ...nr, description: descp }))
                }} className="room-input" required />
            </Modal>
        </React.Fragment>
    );
}

export default RoomsArea;