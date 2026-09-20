require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const Job = require("./Job");
const bcrypt = require("bcrypt");
const User = require("./User");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./authMiddleware");
const roleMiddleware = require("./roleMiddleware");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Connection error:", err));

app.get("/", (req, res) => {
  res.send("Hello from my first server");
});

app.get("/jobs", async (req, res) => {
  const jobs = await Job.find();
  res.json(jobs);
});

app.get("/jobs/:id", async (req, res) => {
  const job = await Job.findById(req.params.id);
  res.json(job);
});

app.post("/jobs", authMiddleware, roleMiddleware(["manager", "owner"]), async (req, res) => {
  const newJob = new Job({ title: req.body.title });
  await newJob.save();
  res.json(newJob);
});

app.put("/jobs/:id", authMiddleware, async (req, res) => {
  if (req.body.status === "claimed") {
    const activeJobsCount = await Job.countDocuments({
      claimedBy: req.user.userId,
      status: { $in: ["claimed", "in-progress"] }
    });

    const MAX_ACTIVE_JOBS = 3;

    if (activeJobsCount >= MAX_ACTIVE_JOBS) {
      return res.status(400).json({
        message: "You already have the maximum number of active jobs (3). Complete one before claiming another."
      });
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: "claimed", claimedBy: req.user.userId },
      { new: true }
    );
    return res.json(job);
  }

  const job = await Job.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(job);
});

app.put("/jobs/:id/assign", authMiddleware, roleMiddleware(["manager", "owner"]), async (req, res) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    {
      assignedTo: req.body.staffName,
      claimedBy: req.body.staffId,
      status: "claimed"
    },
    { new: true }
  );
  res.json(job);
});

app.delete("/jobs/:id", authMiddleware, roleMiddleware(["manager", "owner"]), async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);
  res.json({ message: "Job deleted" });
});

app.post("/signup", async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const allowedSignupRoles = ["customer", "staff"];
  const safeRole = allowedSignupRoles.includes(req.body.role) ? req.body.role : "customer";

  const newUser = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    role: safeRole
  });

  await newUser.save();
  res.json({ message: "User created successfully" });
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(req.body.password, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Incorrect password" });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

 res.json({ token, name: user.name, role: user.role, userId: user._id });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.get("/users/staff", authMiddleware, roleMiddleware(["manager", "owner"]), async (req, res) => {
  const staffList = await User.find({ role: "staff" }, "name email");
  res.json(staffList);
});