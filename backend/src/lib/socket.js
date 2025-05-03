import {Server} from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    
  },
});
export function getReceiverSocketId(userId) {
  return useSocketMap[userId] || null;
}


const useSocketMap={};

io.on('connection', (socket) => {
  console.log('A user connected',socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    useSocketMap[userId] = socket.id;
  }
  io.emit("getOnlineUsers",Object.keys(useSocketMap))


  socket.on('disconnect', () => {
    console.log('A user disconnected', socket.id);
    delete useSocketMap[userId];
    io.emit("getOnlineUsers",Object.keys(useSocketMap))
  });
});
export {io,app,server}