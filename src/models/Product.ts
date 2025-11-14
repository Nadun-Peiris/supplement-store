import mongoose, { Schema, models } from "mongoose";

const ProductSchema = new Schema(
  {
    name: String,
    brand: String,
    category: String,
    price: Number,
    stock: Number,
    imageUrl: String,
  },
  { timestamps: true, collection: "products" } // ✅ matches Atlas
);

export default models.Product || mongoose.model("Product", ProductSchema);
