import mongoose from "mongoose";

const creditTransactionSchema = new mongoose.Schema(
  {
    bdeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bdeName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true, // positive for allocation/topup, negative for lead unlock
    },
    type: {
      type: String,
      enum: ["allocation", "unlock", "refund"],
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },
    leadCompany: {
      type: String,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const CreditTransaction = mongoose.model("CreditTransaction", creditTransactionSchema);
