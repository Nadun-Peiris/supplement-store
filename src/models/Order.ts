// src/models/Order.ts
import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IOrder extends Document {
  user?: mongoose.Types.ObjectId | null;
  guestUser?: mongoose.Types.ObjectId | null;

  orderType: "one_time" | "subscription";

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

  shippingMethod: "local_pickup" | "express_3_days";

  paymentProvider:
    | "bank_transfer"
    | "payhere"
    | "lemon_one_time"
    | "lemon_subscription";

  paymentReference?: string | null;
  subscriptionId?: string | null;
  nextBillingDate?: Date | null;

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

  status: "pending" | "paid" | "failed" | "cancelled";

  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    guestUser: {
      type: Schema.Types.ObjectId,
      ref: "GuestUser",
      default: null,
    },

    orderType: {
      type: String,
      enum: ["one_time", "subscription"],
      default: "one_time",
    },

    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: String,
        price: Number,
        quantity: Number,
        lineTotal: Number,
      },
    ],

    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    total: { type: Number, required: true },

    shippingMethod: {
      type: String,
      enum: ["local_pickup", "express_3_days"],
      default: "local_pickup",
    },

    paymentProvider: {
      type: String,
      enum: [
        "bank_transfer",
        "payhere",
        "lemon_one_time",
        "lemon_subscription",
      ],
      default: "bank_transfer",
    },

    paymentReference: {
      type: String,
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

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
    },

    subscriptionId: {
      type: String,
      default: null,
    },

    nextBillingDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default (models.Order as mongoose.Model<IOrder>) ||
  model<IOrder>("Order", OrderSchema);
