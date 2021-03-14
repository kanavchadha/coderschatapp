const queuedMsgs = {};

const queueMsg = (roomId, recieverId, msgId) => {
    if (!queuedMsgs[recieverId]) {
        queuedMsgs[recieverId] = { [roomId]: [msgId] };
    } else if (!queuedMsgs[recieverId][roomId]) {
        queuedMsgs[recieverId][roomId] = [msgId];
    } else {
        queuedMsgs[recieverId][roomId].push(msgId);
    }
    // console.log(queuedMsgs)
}
const removeQueuedMsg = (roomId, recieverId) => {
    if (!queuedMsgs[recieverId]) {
        return;
    }
    queuedMsgs[recieverId][roomId] = [];
    // console.log(queuedMsgs)
}

const getUserQueuedMsgs = (recieverId) => {
    return queuedMsgs[recieverId];
}

module.exports = {
    queueMsg,
    removeQueuedMsg,
    getUserQueuedMsgs
}