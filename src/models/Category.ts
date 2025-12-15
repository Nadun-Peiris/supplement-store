import mongoose, { Schema, Document } from "mongoose";
import slugify from "slugify";

export interface ICategory extends Document {
  name: string;
  slug: string;
  image: string;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  image: { type: String, required: true },
});

CategorySchema.index({ slug: 1 }, { unique: true });

// Auto-generate slug
CategorySchema.pre("save", function (next) {
  if (!this.slug || this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);
