import mongoose, { Schema, Document } from "mongoose";
import slugify from "slugify";

export interface IBrand extends Document {
  name: string;
  image?: string; // brand logo (optional)
  slug: string;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, unique: true },
    image: { type: String, default: "" }, // optional
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

// Generate slug automatically
BrandSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.models.Brand ||
  mongoose.model<IBrand>("Brand", BrandSchema);
