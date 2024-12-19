const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // To associate events with a user
  type: { type: String, enum: ["general", "academic"], default: "general" }, //distinction between Milestones and general events
  completed: { type: Boolean, default: false }
});

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;
