require("dotenv").config();

const axios = require("axios");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Mechanic = require("../models/mechanic");
const Cleaner = require("../models/cleaner");
const Driver = require("../models/driver");

const users = new Map();

const rooms = {};

const initializeSocket = (server) => {
  // Pass the CORS Policy because the socket server is different
  const io = require("socket.io")(server, {
    cors: {
      origin: [process.env.F_URL],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware for token verification and user validation
  io.use(async (socket, next) => {
    const token = socket.handshake.headers.token;

    // Validate and decode the token
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        let Provider = "";
        let user = "";
        const role = payload.role;

        if (role === "user") {
          user = await User.findOne({ userUid: payload.userUid });
        } else if (role === "mechanic") {
          Provider = Mechanic;
        } else if (role === "cleaner") {
          Provider = Cleaner;
        } else {
          Provider = Driver;
        }

        let provider = "";

        if (role !== "user") {
          provider = await Provider.findOne({
            [`${role}Uid`]: payload[`${role}Uid`],
          });
        }

        if (role !== "user" && !provider) {
          console.log("No service provider account found");
        }

        if (role === "user" && !user) {
          console.log("User not found");
        }

        next();
      } catch (error) {
        console.log(error.message);
      }
    } else {
      console.log("Sign In first to access this page");
    }
  });

  // Connection establishment starts here
  io.on("connection", (socket) => {
    // Event for sp (service provider) to join there room
    socket.on("join-room-sp", async (data) => {
      const { ticketId, Uid, location } = data; // Retrieve data

      if (!ticketId) {
        return await sendError(socket.id, "No ticketId found");
      }

      if (!Uid) {
        return await sendError(socket.id, "No sp Uid found");
      }

      if (!location) {
        return await sendError(socket.id, "No location data found");
      }

      if (!users.has(Uid)) {
        socket.join(ticketId); // Join the socket to the room

        // If room is not created then create it
        if (!rooms[ticketId]) {
          rooms[ticketId] = { user: {}, serviceProvider: {} };
        }

        // Add the sp details
        rooms[ticketId].serviceProvider.Uid = Uid;
        rooms[ticketId].serviceProvider.location = location;
        rooms[ticketId].serviceProvider.socketId = socket.id;

        console.log(
          `Service Provider ${rooms[ticketId].serviceProvider.Uid} joined room with socketId : ${rooms[ticketId].serviceProvider.socketId}`
        );

        users.set(Uid + "/sp", socket); // Store sp's socket details

        // Emit the room joining event
        await sendRoomJoined(socket.id, "Room joined");

        // If both the user and sp have joined
        if (rooms[ticketId].user.Uid && rooms[ticketId].serviceProvider.Uid) {
          const data = await getEncodedPolyline(ticketId);

          const serviceProviderSocketId =
            rooms[ticketId].serviceProvider.socketId;

          // Send the event of encoded-polyline to both user and sp
          if (serviceProviderSocketId) {
            io.to(serviceProviderSocketId).emit("encoded-polyline", {
              data,
            });
          }

          const userSocketId = rooms[ticketId].user.socketId;
          if (userSocketId) {
            io.to(userSocketId).emit("encoded-polyline", {
              data,
            });
          }
        }
      } else {
        users.get(rooms[ticketId].serviceProvider.Uid + "/sp").leave(ticketId); // Remove the old socket

        // Join new socket
        socket.join(ticketId);
        rooms[ticketId].serviceProvider.socketId = socket.id; // add new socketId

        users.set(Uid + "/sp", socket); // Update the new socket
      }
    });

    // Event for user to join there room
    socket.on("join-room-user", async (data) => {
      const { ticketId, Uid, location } = data;

      if (!ticketId) {
        return await sendError(socket.id, "No ticketId found");
      }

      if (!Uid) {
        return await sendError(socket.id, "No user Uid found");
      }

      if (!location) {
        return await sendError(socket.id, "No location data found");
      }

      if (!users.has(Uid)) {
        socket.join(ticketId);

        if (!rooms[ticketId]) {
          rooms[ticketId] = { user: {}, serviceProvider: {} };
        }

        // Add details
        rooms[ticketId].user.Uid = Uid;
        rooms[ticketId].user.location = location;
        rooms[ticketId].user.socketId = socket.id;

        console.log(
          `User ${rooms[ticketId].user.Uid} joined room ${ticketId}  with socketId : ${rooms[ticketId].user.socketId}`
        );

        users.set(Uid + "/user", socket); // Store user's socket details

        // Emit the room joining event
        await sendRoomJoined(socket.id, "Room joined");

        // If both the user and sp have joined
        if (rooms[ticketId].user.Uid && rooms[ticketId].serviceProvider.Uid) {
          const data = await getEncodedPolyline(ticketId); // Calculate polyline

          const serviceProviderSocketId =
            rooms[ticketId].serviceProvider.socketId;
          if (serviceProviderSocketId) {
            io.to(serviceProviderSocketId).emit("encoded-polyline", {
              data,
            });
          }

          const userSocketId = rooms[ticketId].user.socketId;
          if (userSocketId) {
            io.to(userSocketId).emit("encoded-polyline", {
              data,
            });
          }
        }
        // console.log(io);
      } else {
        users.get(rooms[ticketId].user.Uid + "/user").leave(ticketId); // Remove the old socket

        // Join using new socket
        socket.join(ticketId);
        rooms[ticketId].user.socketId = socket.id; // Update socketId

        users.set(Uid + "/user", socket); // Store user's new socket details
      }
    });

    // Event for the sp to update its location so that the sp location can be sent to the user
    socket.on("update-location", async (data) => {
      const { ticketId, location } = data;

      if (!ticketId) {
        return await sendError(socket.id, "No ticketId found");
      }

      if (!location || location.length < 2) {
        return await sendError(socket.id, "No location data found");
      }

      rooms[ticketId].serviceProvider.location = location; // Store the updated location in the Room

      // Get User's socketId
      const userSocketId = rooms[ticketId].user.socketId;

      // Send updated location to the user by emitting event
      if (userSocketId) {
        io.to(userSocketId).emit("updated-location-sp", {
          location,
        });
      }
    });

    // Event to calculate the route again, If required then use else remove in future
    socket.on("re-calculate-route", async ({ ticketId }) => {
      if (!ticketId) {
        return sendError(socket.id, "No ticketId found");
      }

      const data = await getEncodedPolyline(ticketId);

      const serviceProviderSocketId = rooms[ticketId].serviceProvider.socketId;
      if (serviceProviderSocketId) {
        io.to(serviceProviderSocketId).emit("encoded-polyline", {
          data,
        });
      }

      const userSocketId = rooms[ticketId].user.socketId;
      if (userSocketId) {
        io.to(userSocketId).emit("encoded-polyline", {
          data,
        });
      }
    });

    // Event to close connection
    socket.on("close-connection", async ({ ticketId, role }) => {
      if (!role) {
        return await sendError(socket.id, "No role found");
      }

      if (!ticketId) {
        return await sendError(socket.id, "No ticketId found");
      }

      // To delete the data in users map and update room
      if (role === "user") {
        users.delete(rooms[ticketId].user.Uid + "/user");
        rooms[ticketId].user = null;
      } else {
        users.delete(rooms[ticketId].serviceProvider.Uid + "/sp");
        rooms[ticketId].serviceProvider = null;
      }

      // Emit the disconnect event
      io.to(socket.id).emit("disconnection", {
        message: "Socket disconnected from server",
      });

      // Now leave and disconnect
      socket.leave(ticketId);
      socket.disconnect();

      // Delete the room data
      if (!rooms[ticketId].user && !rooms[ticketId].serviceProvider) {
        delete rooms[ticketId];
      }
    });
  });

  // Function to emit Error event
  async function sendError(socketId, message) {
    io.to(socketId).emit("error", {
      message,
    });
  }

  // Function to emit Room joined event
  async function sendRoomJoined(socketId, message) {
    io.to(socketId).emit("room-joined", {
      message,
    });
  }

  return io;
};

// Function to get the encoded polyline
async function getEncodedPolyline(ticketId) {
  const userLocation = rooms[ticketId].user.location;
  const spLocation = rooms[ticketId].serviceProvider.location;

  // The parameters could be changed as per the requirements
  const data = {
    origin: {
      location: {
        latLng: {
          latitude: parseFloat(spLocation[0]),
          longitude: parseFloat(spLocation[1]),
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: parseFloat(userLocation[0]),
          longitude: parseFloat(userLocation[1]),
        },
      },
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_UNAWARE",
    polylineQuality: "HIGH_QUALITY",
    routeModifiers: {
      avoidTolls: false,
      avoidHighways: false,
      avoidFerries: false,
    },
    languageCode: "en-US",
    units: "IMPERIAL",
  };

  try {
    const response = await axios.post(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      data,
      {
        headers: {
          "X-Goog-Api-Key": process.env.TESTING_API_KEY,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        },
        // These are required headers
        // To perform the Navigation thing we will not use the polyline, instead we would get routes array
      }
    );

    return response?.data?.routes[0]; // Send the response
  } catch (error) {
    console.log("Error : ", error.message);
    return {};
  }
}

module.exports = { initializeSocket };
