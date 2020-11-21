import React, { Component } from 'react'
import io from "socket.io-client";
import { connect } from "react-redux";
import moment from "moment";
import { getChats, afterPostMessage, afterDeleteMessage } from "../../../_actions/chat_actions"
import ChatCard from "./Sections/ChatCard"
import Dropzone from 'react-dropzone';
import Axios from 'axios';

import { Form, Input, Button, BackTop, message, Drawer, Select, Alert, notification, Spin } from 'antd';
import { MessageOutlined, EnterOutlined, UploadOutlined, SmileOutlined, SendOutlined, PlayCircleOutlined } from '@ant-design/icons';
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
        chatMessage: "",
        showEmojis: false,
        codeDrawer: false,
        codeMessage: "",
        progLanguage: "javascript",
        codeOutput: {},
        execLoading: false
    }

    componentDidMount() {
        let server = "https://codingchatapp.herokuapp.com";
        // let server = "http://localhost:5000";

        this.props.dispatch(getChats());

        this.socket = io(server);

        this.socket.on("Error", errorMessageFromBackEnd => {
            message.error(errorMessageFromBackEnd);
        })

        this.socket.on("Output Chat Message", messageFromBackEnd => {
            this.props.dispatch(afterPostMessage(messageFromBackEnd));
        })

        this.socket.on("After Delete Chat Message", messageId => {
            this.props.dispatch(afterDeleteMessage(messageId));
        })

    }

    componentDidUpdate() {
        this.messagesEnd.scrollIntoView({ behavior: 'smooth' });
    }

    hanleSearchChange = (e) => {
        this.setState({
            chatMessage: e.target.value
        })
    }

    renderCards = () =>
        this.props.chats.chats
        && this.props.chats.chats.map((chat) => (
            <ChatCard key={chat._id} currUserId={ this.props.user.userData?this.props.user.userData._id:null} {...chat} delMsg={this.deleteMessage} runChatCode={this.runChatCodeSnippet} />
        ));

    onDrop = (files) => {
        console.log(files)
        if (this.props.user.userData && !this.props.user.userData.isAuth) {
            return alert('Please Log in first');
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

                    this.socket.emit("Input Chat Message", {
                        chatMessage,
                        userId,
                        userName,
                        userImage,
                        nowTime,
                        type
                    });
                }
            })
    }

    submitChatMessage = (e) => {
        e.preventDefault();

        if (this.props.user.userData && !this.props.user.userData.isAuth) {
            return message.error("Please Login First!");
        }

        let chatMessage = this.state.chatMessage
        let userId = this.props.user.userData._id
        let userName = this.props.user.userData.name;
        let userImage = this.props.user.userData.image;
        let nowTime = moment();
        let type = "Text"

        this.socket.emit("Input Chat Message", {
            chatMessage,
            userId,
            userName,
            userImage,
            nowTime,
            type
        });
        this.setState({ chatMessage: "" })
    }

    sendCodeSnippet = () => {
        if (this.props.user.userData && !this.props.user.userData.isAuth) {
            return message.error("Please Login First!");
        }

        let chatMessage = this.state.codeMessage
        let userId = this.props.user.userData._id
        let userName = this.props.user.userData.name;
        let userImage = this.props.user.userData.image;
        let nowTime = moment();
        let type = "Code#" + this.state.progLanguage;

        this.socket.emit("Input Chat Message", {
            chatMessage,
            userId,
            userName,
            userImage,
            nowTime,
            type
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
        
        Axios.post('api/chat/executeCode',{code: code,language: language}).then(({data})=>{
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
        Axios.post('api/chat/executeCode',{code: code,language: language}).then(({data})=>{
            const args = {
                    message: `Output: - ${moment(time.toString()).format('YYYY-MM-DD HH:mm:ss')}`,
                    description: data.error ? data.error : data.output,
                    duration: 0,
                }            
            if(data.error){
                notification.error(args);
            }else{
                notification.success(args);
            }
        });
    }

    deleteMessage = ({ msgId, senderId }) => {
        if (this.props.user.userData && !this.props.user.userData.isAuth) {
            return message.error("Please Login First!");
        }
        this.socket.emit("Delete Chat Message", { msgId, senderId });
    }

    render() {
        return (
            <React.Fragment>
                <div>
                    <p style={{ fontSize: '2rem', textAlign: 'center' }}> Real Time Chat</p>
                </div>

                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                    <div className="infinite-container" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
                        {this.props.chats && (
                            this.renderCards()
                        )}
                        <div ref={el => { this.messagesEnd = el }}
                            style={{ clear: "both" }}
                        />
                    </div>

                    <Form layout="inline" id="bottomInputBox" onSubmit={this.submitChatMessage}>
                        {this.state.showEmojis && <Picker onSelect={(e) => this.setState((prevState, props) => { return { chatMessage: prevState.chatMessage + e.native } })} style={{ position: 'fixed', bottom: '40px', left: '6px', zIndex: '10' }} />}
                        <SmileOutlined style={{ fontSize: '1.25rem', padding: '0 5px' }} onClick={() => this.setState((prevState, props) => { return { showEmojis: !prevState.showEmojis } })} />
                        <Input
                            id="message"
                            prefix={<MessageOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder="Let's start talking"
                            type="text"
                            value={this.state.chatMessage}
                            onChange={this.hanleSearchChange}
                        />
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
                        <Button type="primary" onClick={this.submitChatMessage} htmlType="submit">
                            <EnterOutlined />
                        </Button>
                    </Form>

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
                                <Button onClick={this.sendCodeSnippet} type="primary" disabled={!this.state.codeMessage}>Send <SendOutlined /></Button>
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
                    <div className="codeButton" onClick={() => { this.setState({ codeDrawer: true }) }}><FaCode style={{ fontSize: '1.6rem' }} /></div>
                    <BackTop />
                </div>
            </React.Fragment>
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
