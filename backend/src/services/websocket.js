const logger = require('../utils/logger');

let io;

const initializeSocket = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join disaster-specific rooms
    socket.on('join_disaster', (disasterId) => {
      socket.join(`disaster_${disasterId}`);
      logger.debug(`Client ${socket.id} joined disaster room: ${disasterId}`);
    });

    // Leave disaster-specific rooms
    socket.on('leave_disaster', (disasterId) => {
      socket.leave(`disaster_${disasterId}`);
      logger.debug(`Client ${socket.id} left disaster room: ${disasterId}`);
    });

    // Join location-based rooms for real-time updates
    socket.on('join_location', (locationData) => {
      const { lat, lng, radius = 10 } = locationData;
      const locationRoom = `location_${Math.round(lat * 100)}_${Math.round(lng * 100)}_${radius}`;
      socket.join(locationRoom);
      logger.debug(`Client ${socket.id} joined location room: ${locationRoom}`);
    });

    // Handle user typing in real-time chat (for future feature)
    socket.on('typing', (data) => {
      socket.to(`disaster_${data.disasterId}`).emit('user_typing', {
        userId: data.userId,
        isTyping: data.isTyping
      });
    });

    // Handle emergency alerts
    socket.on('emergency_alert', (data) => {
      if (data.priority === 'urgent') {
        // Broadcast urgent alerts to all connected clients
        io.emit('urgent_alert', {
          message: data.message,
          location: data.location,
          timestamp: new Date().toISOString()
        });
        logger.warn(`Urgent alert broadcasted: ${data.message}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for client ${socket.id}:`, error);
    });
  });

  logger.info('✅ WebSocket server initialized');
};

// Utility functions to emit events from other parts of the application
const emitDisasterUpdate = (disasterId, eventType, data) => {
  if (!io) return;
  
  io.to(`disaster_${disasterId}`).emit(eventType, {
    disasterId,
    data,
    timestamp: new Date().toISOString()
  });
  
  logger.debug(`Emitted ${eventType} for disaster ${disasterId}`);
};

const emitLocationUpdate = (lat, lng, radius, eventType, data) => {
  if (!io) return;
  
  const locationRoom = `location_${Math.round(lat * 100)}_${Math.round(lng * 100)}_${radius}`;
  io.to(locationRoom).emit(eventType, {
    location: { lat, lng, radius },
    data,
    timestamp: new Date().toISOString()
  });
  
  logger.debug(`Emitted ${eventType} for location ${lat}, ${lng}`);
};

const broadcastAlert = (alertData) => {
  if (!io) return;
  
  io.emit('system_alert', {
    ...alertData,
    timestamp: new Date().toISOString()
  });
  
  logger.info(`System alert broadcasted: ${alertData.type}`);
};

const emitToUser = (userId, eventType, data) => {
  if (!io) return;
  
  // This would require tracking user sessions
  // For now, emit to all connected clients
  io.emit(eventType, {
    targetUser: userId,
    data,
    timestamp: new Date().toISOString()
  });
  
  logger.debug(`Emitted ${eventType} to user ${userId}`);
};

const getConnectedClients = () => {
  if (!io) return 0;
  return io.engine.clientsCount;
};

const getRoomInfo = (roomName) => {
  if (!io) return null;
  
  const room = io.sockets.adapter.rooms.get(roomName);
  return {
    name: roomName,
    clientCount: room ? room.size : 0,
    clients: room ? Array.from(room) : []
  };
};

// Periodic cleanup of empty rooms
const cleanupRooms = () => {
  if (!io) return;
  
  const rooms = io.sockets.adapter.rooms;
  let cleanedCount = 0;
  
  rooms.forEach((clients, roomName) => {
    if (clients.size === 0) {
      rooms.delete(roomName);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    logger.debug(`Cleaned up ${cleanedCount} empty rooms`);
  }
};

// Start periodic room cleanup
setInterval(cleanupRooms, 5 * 60 * 1000); // Every 5 minutes

module.exports = {
  initializeSocket,
  emitDisasterUpdate,
  emitLocationUpdate,
  broadcastAlert,
  emitToUser,
  getConnectedClients,
  getRoomInfo
};