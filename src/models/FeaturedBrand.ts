import mongoose, { Schema, models } from "mongoose";

const FeaturedBrandSchema = new Schema(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      unique: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default models.FeaturedBrand ||
  mongoose.model("FeaturedBrand", FeaturedBrandSchema);
