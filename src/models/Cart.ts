import mongoose, { Schema, Document } from "mongoose";

export interface ICart extends Document {
  userId?: string;
  guestId?: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
}

const CartSchema = new Schema<ICart>(
  {
    userId: { type: String, required: false },
    guestId: { type: String, required: false },
    items: [
      {
        productId: { type: String, required: true },
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 },
        image: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Cart || mongoose.model<ICart>("Cart", CartSchema);
