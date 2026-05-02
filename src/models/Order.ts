import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IOrder extends Document {
  user?: mongoose.Types.ObjectId | null;
  guestUser?: mongoose.Types.ObjectId | null;
  subscription?: mongoose.Types.ObjectId | null;
  // TODO: migrate to admin-compatible structure after PayHere/cart cleanup no longer depends on these fields.
  subscriptionId?: string | null;
  cartOwnerUserId?: string | null;
  cartOwnerGuestId?: string | null;
  orderType: "normal" | "subscription";
  shippingMethod: "standard_shipping";
  renewalNumber?: number | null;

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

  paymentStatus: "pending" | "paid" | "failed" | "refunded";

  paymentReference?: string | null;

  fulfillmentStatus:
    | "unfulfilled"
    | "fulfilled"
    | "shipped"
    | "completed";

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
      // TODO: remove this ref if guest orders continue using cartOwnerGuestId only.
      // No GuestUser model currently exists in either repo.
      ref: "GuestUser",
      default: null,
    },

    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },

    // Temporary ecommerce runtime field used by checkout success, dashboard,
    // emails, and PayHere webhook flows until subscription linkage is fully
    // migrated to admin-compatible refs only.
    subscriptionId: {
      type: String,
      default: null,
    },

    // Temporary ecommerce runtime field used to clean up authenticated-user
    // carts after PayHere confirmation without trusting the frontend.
    cartOwnerUserId: {
      type: String,
      default: null,
    },

    // Temporary ecommerce runtime field used to clean up guest carts after
    // PayHere confirmation until guest order ownership is migrated safely.
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

    shippingMethod: {
      type: String,
      enum: ["standard_shipping"],
      default: "standard_shipping",
      required: true,
    },

    renewalNumber: {
      type: Number,
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
      enum: ["payhere"],
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
