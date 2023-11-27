require("express-async-errors");
require("dotenv").config();

const mongoose = require("mongoose");
const connectWithDB = require("./config/dbConfig");

const cookieParser = require("cookie-parser");
const cors = require("cors");

const errorMiddleware = require("./middlewares/errorhandler");
const notFoundMiddleware = require("./middlewares/notfound");

const express = require("express");
const app = express();
const server = require("http").createServer(app);

const { initializeSocket } = require("./controllers/socketController");

app.use(
  cors({
    origin: [
      process.env.F_URL,
      process.env.F_URL2,
      process.env.LIVE_F_URL_ADMIN,
      process.env.LIVE_F_URL_WEB,
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", (req, res) => {
  return res.status(200).json({
    msg: "Working",
  });
});

app.use(errorMiddleware);
app.use(notFoundMiddleware);

let io;
async function startServer() {
  try {
    // DB configuration
    await connectWithDB(process.env.DB_URI);

    io = initializeSocket(server);

    server.listen(process.env.PORT, () => {
      console.log(`App listening at http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error - " + error.message);

    await mongoose.connection.close();
    console.log("Database connection closed");

    if (io) {
      io.close();
      console.log("Sockets closed");
    }

    console.log("Server is shutting down");
    process.exit();
  }
}

startServer();
