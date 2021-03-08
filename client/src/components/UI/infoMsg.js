import React from 'react';
import { InfoCircleTwoTone } from '@ant-design/icons';

function InfoMsg(props) {
    return <div className="infoMsg">
            <InfoCircleTwoTone />
            <div>{props.msg}</div>
            <div>{props.time}</div>
        </div>
}

export default InfoMsg;