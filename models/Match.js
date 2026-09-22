import mongoose from "mongoose";

const MatchSchema = new mongoose.Schema(
  {
    homeTeam: { type: String, required: true, trim: true, maxlength: 60 },
    awayTeam: { type: String, required: true, trim: true, maxlength: 60 },
    date: { type: Date, required: true },
    venue: { type: String, required: true, trim: true, maxlength: 100 },
    homeScore: { type: Number, default: 0, min: 0, max: 30 },
    awayScore: { type: Number, default: 0, min: 0, max: 30 },
    status: { type: String, enum: ["scheduled", "live", "finished"], default: "scheduled" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Match || mongoose.model("Match", MatchSchema);
