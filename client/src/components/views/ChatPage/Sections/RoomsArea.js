import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getRooms, addRoom, updateRoom, deleteRoom } from '../../../../_actions/chat_actions';
import RoomThread from './RoomThread';
import axios from 'axios';
import { Drawer, Button, Spin, Image, List, Avatar, message, Modal, Popconfirm, Input, Alert, Tooltip, Tabs, Empty } from 'antd';
import { DeleteFilled, EditFilled, UserAddOutlined, InfoCircleOutlined, LogoutOutlined, CheckCircleTwoTone, CloseOutlined, CommentOutlined, UserOutlined, MessageTwoTone, StopOutlined } from '@ant-design/icons';
import { CHAT_SERVER } from '../../../Config';
// import { deleteRoom } from '../../../_actions/chat_actions';
const { Search } = Input;
const { TabPane } = Tabs;

function RoomsArea(props) {
    const { currRoom, setCurrRoom, currUserId, currUserName, currUserAvatar, showRooms, setShowRooms, showRoomInfo, setShowRoomInfo, joinRoom, getChats, socket } = props;
    const [loading, setLoading] = useState(true);
    const [userContacts, setContacts] = useState([]);
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

        axios.get(CHAT_SERVER + '/getContacts').then(res => {
            setContacts(res.data);
        })

    }, [])

    const showCurrRoom = (roomId) => {
        if (!rooms) return;
        const cr = rooms.find(r => r._id === roomId);
        if (!cr) {
            console.log('no room detected!', roomId)
            console.log('after creation of oto', rooms);
            return;
        }
        socket.emit('disjoin-room', { name: currUserId, room: currRoom.name, newRoom: cr.name });
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
        }, (err) => {
            message.error(err);
        });
    }

    const leaveRoom = () => {
        if (!currUserId) return;
        if (!currRoom) return;
        socket.emit('Leave Room', { currRoom, currUserId, currUserName }, (err) => {
            message.error(err);
        });
    }

    const isOnline = (user) => {
        if (!currRoom || !currRoom.onlineUsers) return false;
        const online = currRoom.onlineUsers.find(u => u.username === user);
        if (online) return true;
        return false;
    }

    const startOneChatRoom = (chatUser) => {
        const roomData = {
            fuser: currUserName,
            suser: chatUser.name,
            fuid: currUserId,
            suid: chatUser._id,
            logo1: currUserAvatar,
            logo2: chatUser.image
        }
        socket.emit('Create OTO Room', roomData, (res) => {
            if (res.error) {
                message.error(res.error);
            } else {
                console.log(res.room);
                dispatch(getRooms());
                socket.emit('disjoin-room', { name: currUserId, room: currRoom.name, newRoom: res.room.name });
                setCurrRoom(res.room);
                joinRoom(res.room.name);
                getChats(res.room._id);
                setShowRooms();
            }
        })
    }

    const addToContacts = (email) => {
        axios.post(`${CHAT_SERVER}/addMyContacts`, { member: email }).then(res => {
            setContacts(uc => uc.concat(res.data));
            message.success('User Added in Contact List Successfully.');
        }).catch(err => {
            message.error(err.message);
        });
    }

    const isPresentInContact = () => {
        let email = currRoom.members[0].member.name === currUserName ? currRoom.members[1].member.email : currRoom.members[0].member.email
        const userInd = userContacts.findIndex(u => u.email === email);
        return userInd >= 0 ? true : false;
    }

    const blockUser = () => {
        socket.emit('Block User', { room: currRoom, user: currUserId }, (res) => {
            if (res.error) {
                return message.error(res.error);
            }
            message.success('User Blocked!');
        });
    }
    const unblockUser = () => {
        socket.emit('UnBlock User', { room: currRoom, user: currUserId }, (res) => {
            if (res.error) {
                return message.error(res.error);
            }
            message.success('User UnBlocked!');
        });
    }

    const canUnBlock = () => {
        if (currRoom.blocked && currRoom.blocked === currUserId) {
            return true;
        }
        return false;
    }

    const printRoomHandler = (room) => {
        if (room.category === 'group') return false;
        const names = room.name.split('#');
        const logos = room.logo.split('#');
        let dName = names[0];
        let dLogo = logos[0];
        if (currUserName !== names[1]) {
            dName = names[1];
            dLogo = logos[1];
        }
        return { name: dName, logo: dLogo };
    }

    return (
        <React.Fragment>
            <div className={`sidebar ${showRooms && 'toggleDrawer'} `}>
                <div className="sidebar__header">
                    <h2>{currUserName}</h2>
                    <Button className="mobileview" onClick={setShowRooms} icon={<CloseOutlined />} shape="circle" />
                </div>
                <Tabs defaultActiveKey="1" id="chatsData">
                    <TabPane
                        tab={
                            <b> <CommentOutlined /> My Chats</b>
                        }
                        key="1"
                    >
                        <div className="sidebar__body">
                            {loading ? <Spin /> :
                                <div className="allRooms">
                                    {rooms ? rooms.length === 0 ? <Empty style={{ marginTop: '25px' }} /> :
                                        rooms.map(r => <RoomThread key={r._id} name={r.name} logo={r.logo} category={r.category}
                                            currUserName={currUserName} selectedRoom={currRoom ? currRoom.name : ''}
                                            showRoomInfo={() => showCurrRoom(r._id)} />) : ''
                                    }
                                </div>
                            }
                        </div>
                    </TabPane>
                    <TabPane
                        tab={
                            <b> <UserOutlined /> My Contacts</b>
                        }
                        key="2"
                    >
                        <div className="sidebar__body">
                            {loading ? <Spin /> :
                                userContacts && userContacts.length === 0 ? <h3>You don't have Contacts</h3> :
                                    userContacts.map(rm => <div className="roomThread" key={rm._id}>
                                        <div>
                                            <Avatar size='large' src={rm.image} />
                                            <div>
                                                <span className="txtHeading">{rm.name}</span> <br />
                                                <span className="txtBody">{rm.email}</span>
                                            </div>
                                        </div>
                                        <Button icon={<MessageTwoTone />} shape="circle" onClick={() => startOneChatRoom(rm)} />
                                    </div>)
                            }
                        </div>
                    </TabPane>
                </Tabs>
            </div>

            <Drawer
                title={currRoom && printRoomHandler(currRoom) ? printRoomHandler(currRoom).name : currRoom.name}
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
                    <Image height={200} width='100%' src={printRoomHandler(currRoom) ? printRoomHandler(currRoom).logo : currRoom.logo} />
                    <h5 style={{ marginTop: '6px' }}>{currRoom.description}</h5>
                    {currRoom.category === 'group' ? <div>
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
                                                <span>{rm.role === 1 ? ' ~ admin' : ''}</span>
                                            </div>
                                        }
                                        description={rm.member.email}
                                    />
                                </List.Item>
                            )}
                        />
                        <Button icon={<LogoutOutlined />} onClick={leaveRoom} type="primary" style={{ marginTop: '20px' }} danger block> Leave Room </Button>
                    </div> : currRoom.members.length == 2 && <div>
                        <List
                            itemLayout="horizontal"
                            dataSource={currRoom.members.filter(m => m.member._id !== currUserId)}
                            renderItem={rm => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar src={rm.member.image} />}
                                        title={
                                            <div className="membersList">
                                                <span>{rm.member.name} {isOnline(rm.member.email) && <CheckCircleTwoTone />} </span>
                                            </div>
                                        }
                                        description={rm.member.email}
                                    />
                                </List.Item>
                            )}
                        />
                        {!currRoom.blocked ?
                            <Button icon={<StopOutlined />} onClick={blockUser} type="primary" style={{ marginTop: '20px' }} danger block> Block User </Button> :
                            !canUnBlock() ? <Alert message="You are Blocked!" type="error" showIcon /> :
                                <Button icon={<StopOutlined />} onClick={unblockUser} type="primary" style={{ marginTop: '20px' }} danger block> UnBlock User </Button>
                        }
                        {!isPresentInContact() && <Button icon={<UserAddOutlined />} onClick={() => addToContacts(currRoom.members[0].member.name === currUserName ? currRoom.members[1].member.email : currRoom.members[0].member.email)} type="primary" style={{ marginTop: '20px' }} block> Add To Contacts </Button>}
                    </div>
                    }
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