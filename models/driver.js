const { model, Schema } = require("mongoose");

// Driver Schema

const driverSchema = new Schema(
  {
    role: {
      type: String,
      default: "driver",
    },
    driverUid: {
      type: String,
      sparse: true,
    },
    generalDetails: {
      fullName: {
        type: String,
        required: [true, "Please provide full name"],
      },
      email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
      },
      phoneNo: {
        type: String,
        sparse: true,
      },
      address: {
        type: String,
      },
      pincode: {
        type: String,
      },
      googleUserId: {
        type: String,
        unique: true,
        sparse: true,
        select: true,
      },
      photo: {
        type: String,
      },
    },
    documentDetails: {
      aadhaarNo: {
        type: String,
      },
      drivingLicenceNo: {
        type: String,
      },
      panCardNo: {
        type: String,
      },
    },
    bankDetails: {
      bankAccountType: {
        type: String,
      },
      accountHolderName: {
        type: String,
      },
      bankAccountNo: {
        type: String,
      },
      ifscCode: {
        type: String,
      },
    },
    subscription: {
      type: Schema.Types.ObjectId,
    },
    accountDisable: {
      type: Boolean,
      default: true,
      enum: {
        values: [true, false],
        message: "Please provide an option only from --> true or false",
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
      enum: {
        values: [true, false],
        message: "True if mechanic is available for ontime service",
      },
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
  },
  {
    timestamps: true,
  }
);

// Export model

module.exports = model("Driver", driverSchema);
