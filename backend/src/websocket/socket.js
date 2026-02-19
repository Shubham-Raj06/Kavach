const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    // Auth middleware for socket
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) return next(new Error('Authentication required'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const { role, ward, id } = socket.user;
        logger.info(`⚡ Socket connected: user ${id} (${role}) ward ${ward}`);

        // Join role-based rooms
        socket.join(`ward_${ward}_citizen`);
        if (role === 'hospital') {
            socket.join(`ward_${ward}_hospital`);
            socket.join('hospital_room');
        }
        if (role === 'govt') {
            socket.join('govt_room');
        }

        socket.on('join:ward', (targetWard) => {
            socket.join(`ward_${targetWard}_citizen`);
        });

        socket.on('disconnect', () => {
            logger.info(`⚡ Socket disconnected: ${id}`);
        });
    });

    logger.info('✅ Socket.io initialized');
    return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
