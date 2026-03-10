import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IOrder extends Document {
  user?: mongoose.Types.ObjectId | null;
  guestUser?: mongoose.Types.ObjectId | null;

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

  paymentProvider: "payhere" | "lemon";

  paymentStatus: "pending" | "paid" | "failed" | "refunded";

  paymentReference?: string | null;

  fulfillmentStatus:
    | "unfulfilled"
    | "fulfilled"
    | "shipped"
    | "completed";

  courier?: string | null;
  trackingNumber?: string | null;

  shippedAt?: Date | null;
  deliveredAt?: Date | null;

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
      enum: ["payhere", "lemon"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    paymentReference: {
      type: String,
      default: null,
    },

    fulfillmentStatus: {
      type: String,
      enum: ["unfulfilled", "fulfilled", "shipped", "completed"],
      default: "unfulfilled",
    },

    courier: {
      type: String,
      default: null,
    },

    trackingNumber: {
      type: String,
      default: null,
    },

    shippedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
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

export default (models.Order as mongoose.Model<IOrder>) ||
  model<IOrder>("Order", OrderSchema);