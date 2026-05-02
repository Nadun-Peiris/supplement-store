import mongoose, { Schema, models } from "mongoose";

const CategorySchema = new Schema(
  {
    title: { type: String },
    name: { type: String },
    slug: { type: String, required: true },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

CategorySchema.virtual("displayName").get(function () {
  return this.title || this.name || "";
});

export default models.Category ||
  mongoose.model("Category", CategorySchema);
