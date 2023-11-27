const { model, Schema } = require("mongoose");

// Schema

const userSchema = new Schema(
  {
    userUid: {
      type: String,
      sparse: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      select: false,
    },
    phoneNo: {
      type: String,
      sparse: true,
    },
    photo: {
      type: String,
    },
    googleUserId: {
      type: String,
      unique: true,
      sparse: true,
      select: true,
    },
    address: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    role: {
      type: String,
      default: "user",
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "subscription",
    },
    accountDisable: {
      type: Boolean,
      default: false,
      enum: {
        values: [true, false],
        message: "Please provide an option only from --> true or false",
      },
    },
    forgotPasswordToken: {
      type: String,
      select: false,
    },
    forgotPasswordExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Model

module.exports = model("User", userSchema);
