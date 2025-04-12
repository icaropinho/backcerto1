import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  problem: String,
  conversation: [String],
  createdAt: { type: Date, default: Date.now }
});

const Session = mongoose.model("Session", SessionSchema);
export default Session;
