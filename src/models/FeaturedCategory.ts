import mongoose, { Schema, models } from "mongoose";

const FeaturedCategorySchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      unique: true, // 🔥 prevents duplicates
    },
    index: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default models.FeaturedCategory ||
  mongoose.model("FeaturedCategory", FeaturedCategorySchema);
