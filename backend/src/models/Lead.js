import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, "Contact person name is required"],
      trim: true,
    },
    designation: {
      type: String,
      default: "Decision Maker",
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      default: "Hyderabad, India",
    },
    industry: {
      type: String,
      default: "Information Technology",
    },
    source: {
      type: String,
      default: "Excel Upload",
    },
    // Country (Mandatory in Lead Management Plan)
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    // State / City (Optional)
    stateCity: {
      type: String,
      default: "",
      trim: true,
    },
    // Company Address (Optional)
    companyAddress: {
      type: String,
      default: "",
      trim: true,
    },
    // Website (Optional)
    website: {
      type: String,
      default: "",
      trim: true,
    },
    // LinkedIn URL (Optional)
    linkedin: {
      type: String,
      default: "",
      trim: true,
    },
    // Description / Notes (Optional)
    description: {
      type: String,
      default: "",
      trim: true,
    },
    // Category / Domain vertical (e.g. Students / Education, IT & Upskilling, Corporate Training)
    category: {
      type: String,
      default: "Students / Education",
      index: true,
    },
    // Research Analyst who uploaded the lead
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
    batchId: {
      type: String,
      index: true,
    },
    // Master Admin Review Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedOn: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    rejectionHistory: [
      {
        reason: String,
        rejectedOn: { type: Date, default: Date.now },
      },
    ],
    // BDE Allocation & Pipeline
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    assignedName: {
      type: String,
    },
    assignedOn: {
      type: Date,
    },
    // BDEs who paid credits to reveal phone & email
    unlockedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    stage: {
      type: String,
      enum: ["new", "connected", "interested", "not-interested", "out-of-coverage", "follow-up"],
      default: "new",
    },
    followUpDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Lead = mongoose.model("Lead", leadSchema);
