import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { USER_SERVER, CHAT_SERVER } from '../../Config';
import { Tabs, Spin, Skeleton, Card, Avatar, message, Button, Popconfirm, Modal, Input, Popover } from 'antd';
import { WechatOutlined, PicLeftOutlined, EditOutlined, EllipsisOutlined, SettingOutlined, SolutionOutlined, DeleteOutlined, PlusOutlined, UserAddOutlined } from '@ant-design/icons';
import { deleteBlog } from '../../../_actions/blogs_actions';
const { TabPane } = Tabs;
const { Meta } = Card;

function UserProfile(props) {
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [userContacts, setUserContacts] = useState(null);
    const [userRooms, setUserRooms] = useState(null);
    const [userBlogs, setUserBlogs] = useState(null);
    const [newRoom, setNewRoom] = useState({ name: '', logo: '', description: '' });
    const [newContact, setNewContact] = useState('');
    const [showForm, setShowForm] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        axios.get(`${USER_SERVER}/me`).then(response => {
            if (response.status === 200) {
                setUserProfile({ name: response.data.name, email: response.data.email, image: response.data.image, isAdmin: response.data.isAdmin });
                setUserRooms(response.data.myRooms);
                setUserContacts(response.data.myContacts);
                setUserBlogs(response.data.myBlogs);
                setLoading(false);
            } else {
                message.error('Something Went Wrong!');
                setLoading(false);
            }
        });
    }, [])

    const addContacts = () => {
        if (!newContact) {
            return message.error('All field are required!');
        }
        axios.post(`${CHAT_SERVER}/addMyContacts`, { member: newContact }).then(res => {
            console.log(res.data);
            setUserContacts(rm => rm.concat(res.data));
            message.success('User Added in Contact List Successfully.');
            setNewContact('');
        }).catch(err => {
            message.error(err.message);
        });
    }

    const createRoom = () => {
        if (!newRoom.name || !newRoom.logo || !newRoom.description) {
            return message.error('All field are required!');
        }
        axios.post(`${CHAT_SERVER}/createRoom`, newRoom).then(res => {
            console.log(res.data);
            setUserRooms(rm => rm.concat(res.data));
            message.success('New Room Created Successfully.');
            setShowForm(false);
        }).catch(err => {
            message.error(err.message);
        });
    }

    const editMyBlog = (blogId) => {
        if (!userProfile) {
            return message.error('Please Log in first');
        }
        props.history.push({
            pathname: '/editmyblog/' + blogId,
        })
    }

    const blogDeleteHandler = (blogId) => {
        if (!userProfile) {
            return message.error('Please Log in first');
        }
        dispatch(deleteBlog(blogId)).then(res => {
            setUserBlogs(blogs => blogs.filter(ub => ub._id !== blogId));
            message.success('Blog Deleted Successfully!');
        }).catch(err => {
            message.error('Failed! ' + err.message);
        });
    }

    return (
        <div style={{ margin: 'auto', padding: '0 10px', marginTop: 40, maxWidth: '800px' }}>
            <Card
                actions={userProfile && userProfile.isAdmin ? [
                    <SolutionOutlined key="admin" />,
                    <EditOutlined key="edit" />,
                    <EllipsisOutlined key="more" />,
                ] : [
                        <SettingOutlined key="setting" />,
                        <EditOutlined key="edit" />,
                        <EllipsisOutlined key="more" />,
                    ]}
            >
                <Skeleton loading={loading} avatar active>
                    <Meta
                        avatar={
                            <Avatar src={userProfile && userProfile.image} />
                        }
                        title={userProfile && userProfile.name}
                        description={userProfile && userProfile.email}
                    />
                </Skeleton>
            </Card>
            { loading ? <Spin /> :
                <Tabs defaultActiveKey="1" >
                    <TabPane
                        tab={
                            <span> <WechatOutlined /> My Contacts </span>
                        }
                        key="1"
                    >
                        <Card title="My Contacts" bodyStyle={{ maxHeight: '500px', overflow: 'auto' }}>
                            <div className="sideBut">
                                <Popover content={<div className="inline-form">
                                    <Input value={newContact} onChange={(e) => setNewContact(e.target.value)} />
                                    <Button onClick={addContacts} type="primary">Add</Button>
                                </div>} title="Add New Contact" trigger="click">
                                    <Button type="primary" shape="round" icon={<UserAddOutlined />} style={{ marginBottom: '5px' }}> Add Contacts </Button>
                                </Popover>
                            </div>
                            {userContacts && userContacts.length === 0 ? <h3>You don't have Contacts</h3> :
                                userContacts.map(rm => <div className="stripe" key={rm._id}>
                                    <Avatar size='large' src={rm.image} />
                                    <div>
                                        <span className="txtHeading">{rm.name}</span> <br />
                                        <span className="txtBody">{rm.email}</span>
                                    </div>
                                </div>)
                            }
                        </Card>
                    </TabPane>
                    <TabPane
                        tab={
                            <span> <WechatOutlined /> My Chat-Rooms </span>
                        }
                        key="2"
                    >
                        <Card title="My ChatRooms" bodyStyle={{ maxHeight: '500px', overflow: 'auto' }}>
                            <div className="sideBut"><Button type="primary" shape="round" icon={<PlusOutlined />} onClick={() => setShowForm(true)} style={{ marginBottom: '5px' }}> New Room </Button>  </div>
                            {userRooms && userRooms.length === 0 ? <h3>You don't have any chat-rooms yet</h3> :
                                userRooms.map(rm => <div className="gridbox" key={rm._id}>
                                    <div>
                                        <Avatar size='large' src={rm.logo} />
                                        <span className="txtHeading">{rm.name}</span>
                                    </div>
                                </div>)
                            }
                        </Card>
                    </TabPane>
                    <TabPane
                        tab={
                            <span> <PicLeftOutlined /> My Blogs </span>
                        }
                        key="3"
                    >
                        <Card title="My Blogs" bodyStyle={{ maxHeight: '500px', overflow: 'auto' }}>
                            {userBlogs && userBlogs.length === 0 ? <h3>You don't have write any blog yet.</h3> :
                                userBlogs.map(bg => <div key={bg._id} className="gridbox">
                                    <Link to={'/blog/' + bg.slug}>{bg.title}</Link>
                                    <span>
                                        <Button
                                            type="primary"
                                            icon={<EditOutlined />}
                                            onClick={() => editMyBlog(bg._id)}
                                        />
                                        <Popconfirm
                                            placement="leftTop"
                                            title='Are you sure?'
                                            onConfirm={() => blogDeleteHandler(bg._id)}
                                            okText="Yes"
                                            cancelText="No"
                                        >
                                            <Button
                                                type="danger"
                                                icon={<DeleteOutlined />}
                                            />
                                        </Popconfirm>
                                    </span>
                                </div>)
                            }
                        </Card>
                    </TabPane>
                </Tabs>
            }
            <Modal title="Create New Room" visible={showForm} onOk={createRoom} onCancel={() => setShowForm(false)}>
                <input type="text" id="name" placeholder="Name of Room" value={newRoom.name} onChange={(event) => {
                    const name = event.target.value;
                    setNewRoom(nr => ({ ...nr, name: name }))
                }} className="room-input" required />
                <input type="text" id="logo" placeholder="Logo of Room" value={newRoom.logo} onChange={(event) => {
                    const logo = event.target.value;
                    setNewRoom(nr => ({ ...nr, logo: logo }))
                }} className="room-input" required />
                <input type="text" id="description" placeholder="Description of Room" value={newRoom.description} onChange={(event) => {
                    const descp = event.target.value;
                    setNewRoom(nr => ({ ...nr, description: descp }))
                }} className="room-input" required />
            </Modal>
        </div>
    );
}
export default UserProfile;