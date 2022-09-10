const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');
const app = express();

const port = process.env.PORT || 2533;

const server = http.createServer(app);
const io = socketio(server);

const publicDirectory = path.join(__dirname, '../public');
app.use(express.static(publicDirectory));

io.on('connection', (socket)=> {
    console.log('Connection Established')
    

    socket.on('join', ({username, room}, callback)=> {
        const {error, user} = addUser({id: socket.id, username, room});

        if(error){
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin','Welcome'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} Has Joined!`));
        io.to(user.room).emit('userData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback();
    })

    socket.on('sendMessage', (message, callback)=> {
        const user = getUser(socket.id);
        const filter = new Filter();
        if(filter.isProfane(message)){
            return callback('No Bad Words Allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    });

    socket.on('sendLocation', (location, callback)=> {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`));
        callback();
    });

    socket.on('disconnect', ()=> {
        const user = removeUser(socket.id);
        if(user){
        io.to(user.room).emit('message', generateMessage('Admin',`${user.username} Has Left!`));
        io.to(user.room).emit('userData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        }
    });
});

server.listen(port, ()=> {
    console.log('Listening on port ' + port);
})
