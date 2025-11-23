import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  image: string;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  image: { type: String, required: true }, // circular product image
});

export default mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);
