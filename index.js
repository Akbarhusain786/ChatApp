import express from 'express'
import { server } from "socket.io"
import path from 'path'
import { fileURLToPath } from 'url'
import { Server } from 'http'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 2800
const ADMIN = "Admin"

const app = express()

app.use(express.static(path.join(__dirname, "public")))

const expressServer = app.listen(PORT, () => {
    console.log('listening on port ${PORT}')
})

// state
const UsersState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray
    }
}

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV == "production" ? false : ["https://local.myapp.com"]
    }
})

io.on('connection', socket => {
    console.log('User ${socket.id} connected')

    socket.emit('message', buildMsg(ADMIN, "Welcome to the Chat App!"))

    socket.on('enterRoom', ({ name, room}) => {
        // leave previous room
        const prevRoom = getUser(socket.id)?.room

        if (prevRoom) {
            socket.leave(prevRoom)
            io.timeout(prevRoom).emit('message', buildMsg(ADMIN, '${name} has left the room'))
        }

        const user = activateUser(socket.id, name, room)

        // Cannot update previous room users list until after the state update in active user
        if (prevRoom){
            io.to(prevRoom).emit('userlist', {
                users: getUsersInRoom(prevRoom)
            })
        }


        // join room
        socket.join(user.room)

        //to user who joined
        socket.emit('message', buildMsg(ADMIN, 'You have joined the ${user.room} chat room'))

        // to everyone else
        socket.broadcast.to(user.room).emit('message', buildMsg
            (ADMIN, '${user.name} has joined the room'))

        // update user list for room
        io.to(user.room).emit('userList',{
            users: getUsersInRoom(user.room)
        })

        //update rooms list for everyone
        io.emit('roomslist',{
            rooms: getAllActiveRooms()
        })
    })

    // when user disconnects - to all others
    socket.on('disconnect', () => {
        const user = getUser(socket.id)
        usersLeaveApp(socket.id)

        if (user){
            io.to(user.room).emit('message', buildMsg(ADMIN, '${user.name} has left the room'))

            io.to(user.room).emit('userList',{
                users: getUsersInRoom(user.room)
            })

            io.emit('roomList', {
                rooms: getAllActiveRooms()
            })
        }

        console.log('user $(socket.id) disconnected')
    })


    // listening for message event
    socket.on('message', ({ name , text }) => {
        const room = getUser(socket.id)?.room
        if (room) {
            io.to(room).emit('message', buildMsg(name, text))
        }
    })

    // Listen for activity
    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room
        if (room){
            socket.broadcast.to(room).emit('activity')
        }
    })

    // when user disconnect - to all others
    socket.on('disconnect', () => {
        socket.broadcast.emit('message', `User ${socket.id.substring(0, 5)}`);
    })
    
    // Listen for activity
    socket.on('activity', (name) => {
        socket.broadcast.emit('activity', name)
    })

})
function buildMsg(name, text){
    return {
        name, 
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }).format(new Date())
    }
}

// user functions 
function activateUser(id, name, room){
    const user = { id, name, room }
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id),
        user
    ])
    return user
}

function usersLeaveApp(id) {
    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id )
    )
}

function getUser(id){
    return UsersState.users.find(user => user.id === id)
}

function getUsersInRoom(room){
    return UsersState.users.filter(user => user.room === room)
}

function getAllActiveRooms() {
    return Array.from(new Set(UsersState.users.map(user => user.room)))
}
