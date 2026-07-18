import User from "../models/User.js";

export const getUserProfile = async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.themePreference = req.body.themePreference || user.themePreference;

      if (req.body.companyDetails) {
        user.companyDetails = {
          ...user.companyDetails.toObject(),
          ...req.body.companyDetails,
        };
      }

      if (req.body.bankDetails) {
        user.bankDetails = {
          ...user.bankDetails.toObject(),
          ...req.body.bankDetails,
        };
      }

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server Error updating profile", error: error.message });
  }
};
