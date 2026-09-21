const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "claimed", "in-progress", "done"],
    default: "pending"
  },
  assignedTo: { type: String, default: null },
  claimedBy: { type: String, default: null }
});
const Job = mongoose.model("Job", jobSchema);

module.exports = Job;