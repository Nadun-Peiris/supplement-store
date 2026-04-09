import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IPendingOrder extends Document {
  user?: mongoose.Types.ObjectId | null;
  cartOwnerUserId?: string | null;
  cartOwnerGuestId?: string | null;
  orderType: "normal" | "subscription";
  items: {
    product: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentProvider: "payhere";
  paymentStatus: "pending" | "paid" | "failed";
  paymentReference?: string | null;
  subscriptionId?: string | null;
  createdOrderId?: mongoose.Types.ObjectId | null;
  billingDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    country: string;
    postcode: string;
    apartment?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PendingOrderSchema = new Schema<IPendingOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cartOwnerUserId: {
      type: String,
      default: null,
    },
    cartOwnerGuestId: {
      type: String,
      default: null,
    },
    orderType: {
      type: String,
      enum: ["normal", "subscription"],
      default: "normal",
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        price: Number,
        quantity: Number,
        lineTotal: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentProvider: {
      type: String,
      enum: ["payhere"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentReference: {
      type: String,
      default: null,
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    createdOrderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    billingDetails: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
      postcode: { type: String, required: true },
      apartment: { type: String },
    },
  },
  { timestamps: true }
);

export default (models.PendingOrder as mongoose.Model<IPendingOrder>) ||
  model<IPendingOrder>("PendingOrder", PendingOrderSchema);
