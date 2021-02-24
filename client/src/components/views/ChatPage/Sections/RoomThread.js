import React from 'react';
import { Avatar } from 'antd';

function RoomThread(props) {
    return (
        <div className="roomThread" onClick={props.showRoomInfo}>
            <div>
                <Avatar size="large" src={props.logo} />
                <h3 className="txtHeading">{props.name}</h3>
            </div>
        </div>
    );
}

export default RoomThread;