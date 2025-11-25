import mongoose, { Schema, models, InferSchemaType, Model } from "mongoose";
import slugify from "slugify";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },   // NEW FIELD
    category: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    hoverImage: { type: String },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "products" }
);

// Auto-create slug from name
ProductSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export type ProductDocument = InferSchemaType<typeof ProductSchema>;

const Product: Model<ProductDocument> =
  (models.Product as Model<ProductDocument>) ||
  mongoose.model<ProductDocument>("Product", ProductSchema);

export default Product;
