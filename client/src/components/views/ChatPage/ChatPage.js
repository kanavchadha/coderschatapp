import React, { Component } from 'react'
import io from "socket.io-client";
// import { useHistory } from 'react-router-dom';
import { connect } from "react-redux";
import moment from "moment";
import { getChats, afterPostMessage, afterDeleteMessage, addMember, getRooms, removeMember } from "../../../_actions/chat_actions"
import ChatCard from "./Sections/ChatCard"
import RoomArea from "./Sections/RoomsArea"
import Dropzone from 'react-dropzone';
import Axios from 'axios';

import { Form, Input, Button, BackTop, message, Drawer, Select, Alert, notification, Spin, Avatar, Dropdown, Menu, Affix } from 'antd';
import { MessageOutlined, UploadOutlined, SmileOutlined, SendOutlined, PlayCircleOutlined, EllipsisOutlined, ArrowLeftOutlined, SettingOutlined, TeamOutlined, CloseOutlined } from '@ant-design/icons';
import { FaCode } from "react-icons/fa";
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools"

const { Option } = Select;

export class ChatPage extends Component {
    state = {
        currRoom: '',
        showRooms: false,
        showCurrRoomInfo: false,
        chatMessage: "",
        showEmojis: false,
        codeDrawer: false,
        codeMessage: "",
        progLanguage: "javascript",
        codeOutput: {},
        execLoading: false
    }

    disconnectUser = () => {
        console.log('disconnecting...', this.socket);
        this.socket.emit('disconnect');
        this.socket.off();
        this.socket.disconnect();
    }

    componentDidMount() {
        let server = "https://codingchatapp.herokuapp.com";
        // let server = "http://localhost:5000";

        this.socket = io(server);

        this.socket.on("Error", errorMessageFromBackEnd => {
            console.log(errorMessageFromBackEnd);
            message.error(errorMessageFromBackEnd);
        })

        this.socket.on("Output Chat Message", messageFromBackEnd => {
            this.props.dispatch(afterPostMessage(messageFromBackEnd));
        })

        this.socket.on("After Delete Chat Message", messageId => {
            this.props.dispatch(afterDeleteMessage(messageId));
        })

        this.socket.on('Added In Room', () => {
            this.props.dispatch(getRooms());
        })

        this.socket.on('After Adding Member', member => {
            this.props.dispatch(addMember(member))
            this.addMemberInRoom(member);
        })

        this.socket.on('Room Leaved', () => {
            this.props.dispatch(getRooms()).then(async res => {
                if (await res.payload) {
                    if (res.payload.length !== 0) {
                        this.setState({ currRoom: res.payload[0] });
                        this.joinCurrRoom(res.payload[0].name);
                        this.getRoomChats(res.payload[0]._id);
                    }
                }
            })
        })

        this.socket.on('After Leaving Room', data => {
            this.props.dispatch(removeMember(data))
            this.removeMemberInRoom(data);
        })

        this.socket.on('online-users in Room', (userList) => {
            this.setState((prevState) => {
                return {
                    currRoom: {
                        ...prevState.currRoom,
                        onlineUsers: userList
                    }
                }
            })
        })

        this.socket.on('After Blocking Room', data => {
            this.props.dispatch(getRooms());
            if(this.state.currRoom._id === data.room.toString()){
                this.setState(prevState => {
                    return {
                        currRoom: {
                            ...prevState.currRoom,
                            blocked: data.user
                        }
                    }
                })
            }
        })

        this.socket.on('After UnBlocking Room', data => {
            this.props.dispatch(getRooms());
            if(this.state.currRoom._id === data.room){
                this.setState(prevState => {
                    return {
                        currRoom: {
                            ...prevState.currRoom,
                            blocked: null
                        }
                    }
                })
            }
        })

        window.addEventListener('beforeunload', this.disconnectUser);

        window.onpopstate = () => {
            this.disconnectUser();
        }

    }

    componentWillUnmount() { // on leaving this page.
        window.removeEventListener('beforeunload', this.disconnectUser);
    }

    closeChatPage = () => {
        this.disconnectUser();
        this.props.history.push('/');
    }

    componentDidUpdate() {
        this.messagesEnd.scrollIntoView({ behavior: 'smooth' });
    }

    joinCurrRoom = (room) => {
        this.socket.emit('join-room', {
            name: this.props.user.userData.name,
            room: room,
            email: this.props.user.userData.email
        }, (err) => {
            message.error(err);
        });
    }

    getRoomChats = (roomId) => {
        this.props.dispatch(getChats(roomId)).then(res => {
            console.log(res);
        });
    }

    addMemberInRoom = (member) => {
        console.log(member);
        if (!this.state.currRoom) return;
        if (this.state.currRoom._id === member._id && this.props.user.userData._id !== member.userId) {
            const membArr = [...this.state.currRoom.members];
            membArr.push({
                role: member.role,
                member: {
                    email: member.email,
                    name: member.name,
                    image: member.image,
                    _id: member.userId
                }
            })
            this.setState(prevState => {
                return {
                    currRoom: {
                        ...prevState.currRoom,
                        members: membArr
                    }
                }
            })
        }
    }
    removeMemberInRoom = (member) => {
        console.log(member);
        if (!this.state.currRoom) return;
        if (this.state.currRoom._id === member.room._id) {
            let membArr = [...this.state.currRoom.members];
            membArr = membArr.filter((m) => m.member._id !== member.userId)
            this.setState(prevState => {
                return {
                    currRoom: {
                        ...prevState.currRoom,
                        members: membArr
                    }
                }
            })
        }
    }

    hanleSearchChange = (e) => {
        this.setState({
            chatMessage: e.target.value
        })
    }

    renderCards = () =>
        this.props.chats && this.props.chats.chats
        && this.props.chats.chats.map((chat) => (
            <ChatCard key={chat._id} currUserId={this.props.user.userData ? this.props.user.userData._id : null} {...chat} delMsg={this.deleteMessage} runChatCode={this.runChatCodeSnippet} />
        ));

    onDrop = (files) => {
        console.log(files)
        if (this.props.user.userData && !this.props.user.userData.isAuth) {
            return message.error('Please Log in first');
        }
        if(this.state.currRoom && this.state.currRoom.blocked){
            return message.error("User Blocked! You Can't send Message");
        }

        let formData = new FormData();
        const config = {
            header: { 'content-type': 'multipart/form-data' }
        }
        formData.append("file", files[0])
        Axios.post('api/chat/uploadfiles', formData, config)
            .then(response => {
                if (response.data.success) {
                    let chatMessage = response.data.url;
                    let userId = this.props.user.userData._id
                    let userName = this.props.user.userData.name;
                    let userImage = this.props.user.userData.image;
                    let nowTime = moment();
                    let type = "VideoOrImage"
                    let room = this.state.currRoom;

                    this.socket.emit("Input Chat Message", {
                        chatMessage,
                        userId,
                        userName,
                        userImage,
                        nowTime,
                        type,
                        room
                    }, (err) => {
                        message.error(err);
                    });
                } else {
                    message.error(response.data.error);
                }
            })
    }

    submitChatMessage = (e) => {
        e.preventDefault();

        if (this.props.user.userData && !this.props.user.userData.isAuth) {
            return message.error("Please Login First!");
        }
        if(this.state.currRoom && this.state.currRoom.blocked){
            return message.error("User Blocked! You Can't send Message");
        }

        let chatMessage = this.state.chatMessage
        let userId = this.props.user.userData._id
        let userName = this.props.user.userData.name;
        let userImage = this.props.user.userData.image;
        let room = this.state.currRoom;
        let nowTime = moment();
        let type = "Text"

        this.socket.emit("Input Chat Message", {
            chatMessage,
            userId,
            userName,
            userImage,
            room,
            nowTime,
            type
        }, (err) => {
            message.error(err);
        });
        this.setState({ chatMessage: "" })
    }

    sendCodeSnippet = () => {
        if (this.props.user.userData && !this.props.user.userData.isAuth) {
            return message.error("Please Login First!");
        }
        if(this.state.currRoom && this.state.currRoom.blocked){
            return message.error("User Blocked! You Can't send Message");
        }

        let chatMessage = this.state.codeMessage
        let userId = this.props.user.userData._id
        let userName = this.props.user.userData.name;
        let userImage = this.props.user.userData.image;
        let room = this.state.currRoom;
        let nowTime = moment();
        let type = "Code#" + this.state.progLanguage;

        this.socket.emit("Input Chat Message", {
            chatMessage,
            userId,
            userName,
            userImage,
            room,
            nowTime,
            type
        }, (err) => {
            message.error(err);
        });
    }

    runCodeSnippet = () => {
        this.setState({ execLoading: true });
        const code = this.state.codeMessage;
        let language = 'java';
        if (this.state.progLanguage === 'python') {
            language = "python3";
        } else if (this.state.progLanguage === 'c_cpp') {
            language = "cpp14";
        } else if (this.state.progLanguage === 'javascript') {
            language = "nodejs";
        }

        Axios.post('api/chat/executeCode', { code: code, language: language }).then(({ data }) => {
            this.setState({ execLoading: false });
            this.setState({ codeOutput: data });
        });
    }
    runChatCodeSnippet = (code, language, time) => {
        if (language === 'python') {
            language = "python3";
        } else if (language === 'c_cpp') {
            language = "cpp14";
        } else if (language === 'javascript') {
            language = "nodejs";
        }
        Axios.post('api/chat/executeCode', { code: code, language: language }).then(({ data }) => {
            const args = {
                message: `Output: - ${moment(time.toString()).format('YYYY-MM-DD HH:mm:ss')}`,
                description: data.error ? data.error : data.output,
                duration: 0,
            }
            if (data.error) {
                notification.error(args);
            } else {
                notification.success(args);
            }
        });
    }

    deleteMessage = ({ msgId, senderId }) => {
        if (this.props.user.userData && !this.props.user.userData.isAuth) {
            return message.error("Please Login First!");
        }
        this.socket.emit("Delete Chat Message", { msgId, senderId, room: this.state.currRoom.name }, (err) => {
            message.error(err);
        });
    }

    printRoomHandler = (room) => {
        if (room.category === 'group') return false;
        const names = room.name.split('#');
        const logos = room.logo.split('#');
        let dName = names[0];
        let dLogo = logos[0];
        if (this.props.user.userData && this.props.user.userData.name !== names[1]) {
            dName = names[1];
            dLogo = logos[1];
        }
        return { name: dName, logo: dLogo };
    }

    render() {
        return (
            <div className="chatPage">

                <RoomArea
                    currRoom={this.state.currRoom}
                    setCurrRoom={(cr) => { this.setState({ currRoom: cr }) }}
                    currUserId={this.props.user.userData && this.props.user.userData._id}
                    currUserName={this.props.user.userData && this.props.user.userData.name}
                    currUserAvatar={this.props.user.userData && this.props.user.userData.image}
                    showRooms={this.state.showRooms}
                    setShowRooms={() => { this.setState({ showRooms: false }) }}
                    showRoomInfo={this.state.showCurrRoomInfo}
                    setShowRoomInfo={(v) => { this.setState({ showCurrRoomInfo: v }) }}
                    joinRoom={this.joinCurrRoom}
                    getChats={this.getRoomChats}
                    socket={this.socket}
                />

                <div className="roomChats">
                    <Affix offsetTop={0}>
                        <div className="roomHeader">
                            <Button shape="round" icon={<ArrowLeftOutlined />} onClick={this.closeChatPage} />
                            <div>
                                <Avatar src={this.state.currRoom && this.printRoomHandler(this.state.currRoom) ? this.printRoomHandler(this.state.currRoom).logo : this.state.currRoom.logo} />
                                <span className="txtHeading" style={{ color: 'white' }}>{this.state.currRoom && this.printRoomHandler(this.state.currRoom) ? this.printRoomHandler(this.state.currRoom).name : this.state.currRoom.name}</span>
                            </div>
                            <div>
                                <Button icon={<SettingOutlined />} onClick={() => { this.setState({ showCurrRoomInfo: true }) }} shape="circle" />
                                <Button type="primary" shape="round" icon={<TeamOutlined />} size="large" onClick={() => { this.setState((prevState) => ({ showRooms: !prevState.showRooms })) }} id="roomsBut" />
                            </div>
                        </div>
                    </Affix>
                    <div className="infinite-container">
                        {this.props.chats && (
                            this.renderCards()
                        )}
                        <div ref={el => { this.messagesEnd = el }}
                            style={{ clear: "both" }}
                        />
                        <BackTop />
                    </div>

                    <Form layout="inline" id="bottomInputBox" onSubmit={this.submitChatMessage}>
                        <Dropdown overlay={
                            <Menu>
                                <Menu.Item>
                                    <Button onClick={() => { this.setState({ codeDrawer: true }) }}> <FaCode /> </Button>
                                </Menu.Item>
                                <Menu.Item>
                                    <Dropzone onDrop={this.onDrop}>
                                        {({ getRootProps, getInputProps }) => (
                                            <section>
                                                <div {...getRootProps()}>
                                                    <input {...getInputProps()} />
                                                    <Button>
                                                        <UploadOutlined />
                                                    </Button>
                                                </div>
                                            </section>
                                        )}
                                    </Dropzone>
                                </Menu.Item>
                            </Menu>} placement="topCenter" arrow>
                            <Button shape="circle"> <EllipsisOutlined style={{ transform: 'rotate(90deg)' }} /> </Button>
                        </Dropdown>
                        {this.state.showEmojis && <Picker onSelect={(e) => this.setState((prevState, props) => { return { chatMessage: prevState.chatMessage + e.native } })} style={{ position: 'absolute', bottom: '40px', left: '5px', zIndex: '10', width: '280px' }} />}
                        <SmileOutlined style={{ fontSize: '1.25rem', padding: '0 5px' }} onClick={() => this.setState((prevState, props) => { return { showEmojis: !prevState.showEmojis } })} />
                        <Input
                            id="message"
                            prefix={<MessageOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder="Let's start talking"
                            type="text"
                            value={this.state.chatMessage}
                            onChange={this.hanleSearchChange}
                        />
                        <Button type="primary" onClick={this.submitChatMessage} htmlType="submit" size="large" shape="round" disabled={!this.state.chatMessage || (this.state.currRoom&&this.state.currRoom.blocked)}>
                            <SendOutlined />
                        </Button>
                    </Form>
                </div>
                <Drawer title="Coding Editor" height="488px" placement="bottom" className="bottomDrawer"
                    onClose={() => { this.setState({ codeDrawer: false }) }}
                    visible={this.state.codeDrawer}
                    footer={
                        <div className="drawerFooter">
                            <Select defaultValue="javascript" onChange={(value) => { this.setState({ progLanguage: value }) }}>
                                <Option value="javascript">javascript</Option>
                                <Option value="c_cpp">C and C++</Option>
                                <Option value="python">Python</Option>
                                <Option value="java">Java</Option>
                            </Select>
                            <button className="runCode" onClick={this.runCodeSnippet} disabled={!this.state.codeMessage}> Run {this.state.execLoading ? <Spin size="small" /> : <PlayCircleOutlined />} </button>
                            <Button onClick={this.sendCodeSnippet} type="primary" disabled={!this.state.codeMessage || (this.state.currRoom&&this.state.currRoom.blocked)}>Send <SendOutlined /></Button>
                        </div>} >
                    <AceEditor
                        mode={this.state.progLanguage}
                        theme="monokai"
                        onChange={(c) => { this.setState({ codeMessage: c }) }}
                        name="Code-Editor"
                        height="400px"
                        width="auto"
                        placeholder="Write your code here..."
                        editorProps={{ $blockScrolling: true }}
                        setOptions={{
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                            enableSnippets: true
                        }}
                        fontSize="16px"
                        className="editor"
                    />
                    {Object.keys(this.state.codeOutput).length !== 0 &&
                        <Alert message={<div>
                            <div> Output: </div>
                            <div>{this.state.codeOutput.output}</div>
                            <div> CPU-Time: {this.state.codeOutput.cpuTime}</div>
                            <div> Memory: {this.state.codeOutput.memory}</div>
                            {this.state.codeOutput.error && <div style={{ color: '#ba0016' }}> Error: {this.state.codeOutput.error}</div>}
                        </div>
                        } type={this.state.codeOutput.error ? "error" : "success"} style={{ margin: '10px 0px' }} />
                    }
                </Drawer>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        user: state.user,
        chats: state.chat
    }
}


export default connect(mapStateToProps)(ChatPage);
