import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    uploaderName: {
      type: String,
      default: "Research Analyst",
    },
    uploadedOn: {
      type: Date,
      default: Date.now,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    approvedCount: {
      type: Number,
      default: 0,
    },
    rejectedCount: {
      type: Number,
      default: 0,
    },
    pendingCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "mixed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const Batch = mongoose.model("Batch", batchSchema);
