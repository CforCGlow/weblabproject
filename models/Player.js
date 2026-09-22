import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    position: { type: String, enum: ["GK", "DEF", "MID", "FWD"], default: "MID" },
    jerseyNo: { type: Number, min: 1, max: 99, default: 10 },
    goals: { type: Number, default: 0, min: 0 },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Player || mongoose.model("Player", PlayerSchema);
