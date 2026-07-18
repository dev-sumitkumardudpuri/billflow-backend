import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
    },
    themePreference: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    companyDetails: {
      businessName: { type: String, default: "" },
      address: { type: String, default: "" },
      currency: { type: String, default: "USD" },
      phone: { type: String, default: "" },
      website: { type: String, default: "" },
      taxId: { type: String, default: "" },
      customFields: { type: Map, of: String, default: {} },
    },
    bankDetails: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      swiftCode: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
