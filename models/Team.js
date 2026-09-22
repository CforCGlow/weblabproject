import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    coach: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

TeamSchema.index({ name: 1, userId: 1 }, { unique: true });

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);
