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
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong fetching jobs" });
  }
});

app.get("/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong fetching this job" });
  }
});

app.post("/jobs", authMiddleware, roleMiddleware(["manager", "owner"]), async (req, res) => {
  try {
    const newJob = new Job({ title: req.body.title });
    await newJob.save();
    res.json(newJob);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong creating the job" });
  }
});

app.put("/jobs/:id", authMiddleware, async (req, res) => {
  try {
    if (req.body.status === "claimed") {
      if (req.user.role !== "staff") {
        return res.status(403).json({ message: "Only staff can claim jobs" });
      }

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

      const job = await Job.findOneAndUpdate(
        { _id: req.params.id, status: "pending" },
        { status: "claimed", claimedBy: req.user.userId },
        { new: true, runValidators: true }
      );

      if (!job) {
        return res.status(400).json({ message: "This job is no longer available to claim" });
      }

      return res.json(job);
    }

    const existingJob = await Job.findById(req.params.id);

    if (!existingJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    const isOwner = existingJob.claimedBy === req.user.userId;
    const isManagerOrOwner = req.user.role === "manager" || req.user.role === "owner";

    if (!isOwner && !isManagerOrOwner) {
      return res.status(403).json({ message: "You are not authorized to update this job" });
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong updating the job" });
  }
});

app.put("/jobs/:id/assign", authMiddleware, roleMiddleware(["manager", "owner"]), async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo: req.body.staffName,
        claimedBy: req.body.staffId,
        status: "claimed"
      },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong assigning the job" });
  }
});

app.delete("/jobs/:id", authMiddleware, roleMiddleware(["manager", "owner"]), async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong deleting the job" });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are all required" });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

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
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }
    res.status(500).json({ message: "Something went wrong creating your account" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, name: user.name, role: user.role, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong logging you in" });
  }
});

app.get("/users/staff", authMiddleware, roleMiddleware(["manager", "owner"]), async (req, res) => {
  try {
    const staffList = await User.find({ role: "staff" }, "name email");
    res.json(staffList);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong fetching staff" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});