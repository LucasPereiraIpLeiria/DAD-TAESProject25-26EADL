import { Server } from "socket.io"; 

const io = new Server(3000, { /* options */ }); 

io.on("connection", (socket) => { 
    socket.on("echo",(msg)=>{ 
    socket.emit("echo",msg); 
    }); 
}); 