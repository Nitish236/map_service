const { model, Schema } = require("mongoose");

const mechanicSchema = new Schema({
  role: {
    type: String,
    default: "mechanic",
  },
  mechanicUid: {
    type: String,
    sparse: true,
  },
  workshop: {
    type: Schema.Types.ObjectId,
    ref: "Workshop",
  },
  generalDetails: {
    fullName: {
      type: String,
      required: [true, "Please provide a name"],
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
      sparse: true,
    },
    drivingLicenceNo: {
      type: String,
      sparse: true,
    },
    panCardNo: {
      type: String,
      sparse: true,
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
      sparse: true,
    },
    ifscCode: {
      type: String,
    },
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
  subscription: {
    type: Schema.Types.ObjectId,
    ref: "subscription",
  },
});

module.exports = model("Mechanic", mechanicSchema);
