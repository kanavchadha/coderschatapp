const users = []

const addUser = ({id,username,room})=>{
    if(!username || !room){
        return { err: "Username and room are required!" };
    }
    // check for existing user
    const existingUser = users.find((user)=>{
        return user.room === room && user.username === username
    });

    if(existingUser){
        // console.log(users);
        return { user: existingUser};
    }

    const user = {id,username,room}
    users.push(user);
    // console.log(users);
    
    return {user}
}

const updateUser = (id, newRoom)=>{
    const userInd = users.findIndex((us=> us.id === id));
    if(userInd>=0){
        users[userInd].room = newRoom;
    }
}

const removeUser = (id)=>{
    const index = users.findIndex((user) => user.id === id );
    if(index !== -1){
        return users.splice(index,1);
    }
}

const getUserByEmail = (email)=>{
    return users.find((user)=>{
        return email === user.username;
    })
}

const getUser = (id)=>{
    return users.find((user)=>{
        return id === user.id;
    })
}

const getUsersInRoom = (room)=>{
    return users.filter((user)=>{
        return room === user.room;
    })
}

module.exports = {
    addUser,
    updateUser,
    removeUser,
    getUserByEmail,
    getUser,
    getUsersInRoom
}