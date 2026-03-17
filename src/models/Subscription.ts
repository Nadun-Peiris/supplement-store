import { Schema, model, models } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    subscriptionId: {
      type: String,
      required: true,
      unique: true,
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

    status: {
      type: String,
      enum: ["active", "cancelled", "completed", "failed"],
      default: "active",
    },

    adminViewed: {
      type: Boolean,
      default: false,
    },

    nextBillingDate: {
      type: Date,
    },

    lastPaymentDate: {
      type: Date,
      default: Date.now,
    },

    recurrence: {
      type: String,
      default: "1 Month",
    },

    totalInstallmentsPaid: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default models.Subscription ||
  model("Subscription", SubscriptionSchema);
