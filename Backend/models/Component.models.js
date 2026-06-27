import mongoose from "mongoose";

// Stores the raw output of each specialist agent alongside the final
// merged component so the full pipeline is auditable per generation.
const specialistSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["UI_ARCHITECT", "MOTION_DESIGNER", "WEBGL_SPECIALIST"],
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const componentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    componentName: {
      type: String,
      required: true,
    },
    finalCode: {
      type: String,
      required: true,
      default: "",
    },
    specialists: [specialistSchema],
    slug: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

const Component = mongoose.model("Component", componentSchema);
export default Component;
