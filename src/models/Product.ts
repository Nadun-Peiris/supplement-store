import mongoose, { Schema, models } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },        // normal image
    hoverImage: { type: String, required: false },  // hover image
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "products" }
);

const Product = models.Product || mongoose.model("Product", ProductSchema);
export default Product;
