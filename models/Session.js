import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  problem: String,
  conversation: [String],
  createdAt: { type: Date, default: Date.now }
});

const Session = mongoose.model("Session", SessionSchema);
export default Session;
