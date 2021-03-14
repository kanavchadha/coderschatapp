import React from 'react';
import { Avatar, Badge } from 'antd';

function RoomThread(props) {
    const printRoomHandler = (room)=>{
        if(room.category === 'group') return false;
        const names = room.name.split('#');
        const logos = room.logo.split('#');
        let dName = names[0];
        let dLogo = logos[0];
        if(props.currUserName !== names[1]){
            dName = names[1];
            dLogo = logos[1];
        }
        return {name: dName, logo: dLogo};
    }
    return (
        <div className={`roomThread ${props.selectedRoom === props.name && 'selected'}`} onClick={props.showRoomInfo}>
            <div>
                <Avatar size="large" src={printRoomHandler({name: props.name, logo: props.logo, category: props.category})? printRoomHandler({name: props.name, logo: props.logo, category: props.category}).logo : props.logo} />
                <h3 className="txtHeading">{printRoomHandler({name: props.name, logo: props.logo, category: props.category})? printRoomHandler({name: props.name, logo: props.logo, category: props.category}).name : props.name}</h3>
            </div>
            {props.unReadMsgs && props.unReadMsgs[props.id] && <Badge count={props.unReadMsgs[props.id].length} style={{ backgroundColor: '#108ee9' }} className="site-badge-count-4" />}
        </div>
    );
}

export default RoomThread;