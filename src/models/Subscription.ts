import { Schema, model, models } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    subscriptionId: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "completed", "failed"],
      default: "active",
    },

    nextBillingDate: {
      type: Date,
    },

    recurrence: {
      type: String,
      default: "1 Month",
    },

    totalInstallmentsPaid: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

export default models.Subscription ||
  model("Subscription", SubscriptionSchema);
