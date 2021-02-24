import React from "react";
import moment from 'moment';
import { Comment, Tooltip, Avatar, Image, Button, Alert } from 'antd';
import { RestOutlined, PlayCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools"

const APP_DOMAIN = 'https://codingchatapp.herokuapp.com/';
// const APP_DOMAIN = 'http://localhost:5000/';
function ChatCard(props) {
    return ( 
        <React.Fragment>
        {props.type === 'info' ? <Alert message={props.message+' '+ moment(props.createdAt.toString()).format('YYYY-MM-DD HH:mm:ss')} className="infoMsg" type="info" showIcon /> :
        <div className={`message ${props.currUserId && props.currUserId===props.sender._id&&'myMessage'}`}>
            <Comment
                author={props.sender.name}
                avatar={
                    <Avatar
                        src={props.sender.image} alt={props.sender.name}
                    />
                }
                content={ 
                    props.type.split('#')[0] === "Code" ?
                        <AceEditor
                            mode={props.type.split('#')[1]}
                            value={props.message}
                            theme="monokai"
                            name="Read-Code-Editor"
                            height="250px"
                            width="240px"
                            readOnly={true}
                            editorProps={{ $blockScrolling: true }}
                            fontSize="14px"
                        /> 
                     :
                    props.message.substring(0, 8) === "uploads/" ?
                       
                        props.message.substring(props.message.length - 3, props.message.length) === 'mp4' ||
                        props.message.substring(props.message.length - 3, props.message.length) === 'ogg' ?
                            <video
                                style={{ maxWidth: '250px' }}
                                src={`${APP_DOMAIN}${props.message}`} alt="video"
                                type="video/mp4" controls
                            /> :
                        props.message.substring(props.message.length - 3, props.message.length) === 'mp3' ?
                            <audio
                                style={{ maxWidth: '275px' }}
                                src={`${APP_DOMAIN}${props.message}`} alt="audio"
                                type="audio/mp3" controls
                            /> :
                        props.message.substring(props.message.length - 3, props.message.length) === 'png' ||
                        props.message.substring(props.message.length - 4, props.message.length) === 'jpeg' ||
                        props.message.substring(props.message.length - 3, props.message.length) === 'jpg' ?
                            <Image
                                style={{ maxWidth: '225px' }}
                                src={`${APP_DOMAIN}${props.message}`}
                                alt="img"
                            />:
                            <p><FileTextOutlined />: <a href={APP_DOMAIN+props.message} >{props.message.substring(22,props.message.length)}</a> </p>
                    :
                    <p>
                        {props.message}
                    </p>
                }
                datetime={
                    <Tooltip title={moment(props.createdAt.toString()).format('YYYY-MM-DD HH:mm:ss')}>
                        <span>{moment(props.createdAt.toString()).fromNow()}</span>
                    </Tooltip>
                }
            />

            {   props.type.split('#')[0] === "Code" &&
                <Button className="runChatCode" shape="circle" icon={<PlayCircleOutlined />} onClick={()=>props.runChatCode(props.message,props.type.split('#')[1],props.createdAt)} />
            }
            {   props.currUserId===props.sender._id && new Date(props.createdAt).getTime() >= new Date().getTime() - 600000 &&
                <span className="messageDel" onClick={()=>{props.delMsg({msgId: props._id,senderId: props.sender._id})}}>
                    <RestOutlined style={{color: 'white'}}/>
                </span>
            }
            
        </div>}
        </React.Fragment>
    )
}

export default ChatCard;

