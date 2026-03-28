const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Register
exports.register = async (req, res) => {
  const {firstName, lastName, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "User exists" });

  const user = await User.create({ firstName, lastName, email, password, role });

  res.json({
    token: generateToken(user),
    user,
  });
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid creds" });

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(400).json({ message: "Invalid creds" });

  res.json({
    token: generateToken(user),
    user,
  });
};

// Me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "There is no user with that email" });
    }

    // Get reset token (saved to DB already in method)
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Assuming Vite frontend is on 5173
    const frontendResetUrl = `http://localhost:5173/resetpassword/${resetToken}`;
    const message = `You are receiving this email because a password reset was requested. \n\nPlease use the following link to reset your password: \n\n ${frontendResetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "WardWatch System Password Reset",
        message,
      });
      res.status(200).json({ success: true, message: "Email sent successfully" });
    } catch (err) {
      console.log("Nodemailer Error:", err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({ message: "Email could not be sent. Check SMTP configuration." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid token or password reset link has expired" });
    }

    if (!req.body.password || req.body.password.length < 6) {
       return res.status(400).json({ message: "Please provide a valid password of 6+ characters" });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Will run pre('save') hash
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      token: generateToken(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
