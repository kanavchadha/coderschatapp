import React from 'react';
import {Divider} from 'antd';

function UnreadMsgsLine({count}) {
    return (
        <Divider style={{borderColor: '#0b3ce6'}}>
            <span className="unreadLabel">Unread-Messages ({count})</span>
        </Divider>
    );
}

export default UnreadMsgsLine;