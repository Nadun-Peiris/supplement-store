import mongoose, { Schema, models } from "mongoose";

const FeaturedCategorySchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    index: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default models.FeaturedCategory ||
  mongoose.model("FeaturedCategory", FeaturedCategorySchema);
