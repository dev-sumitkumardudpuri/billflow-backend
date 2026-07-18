import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    customFields: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true },
);

const Client = mongoose.model("Client", clientSchema);
export default Client;
