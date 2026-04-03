import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

// Create socket instance with autoConnect: false so listeners can be registered
// before the connection is established. Call connectSocket() after login.
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export const connectSocket = (): void => {
  if (!socket.connected) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    socket.auth = { token };
    socket.connect();
  }
};

export const disconnectSocket = (): void => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
