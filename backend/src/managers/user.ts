import {Socket} from "socket.io";

export interface User {
    socket: Socket;
    name: string;
}