import { Schema, model, models } from "mongoose";

const PayHereWebhookEventSchema = new Schema(
  {
    merchantId: {
      type: String,
      default: null,
    },
    orderId: {
      type: String,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    messageType: {
      type: String,
      default: null,
    },
    statusCode: {
      type: String,
      default: null,
    },
    amount: {
      type: String,
      default: null,
    },
    currency: {
      type: String,
      default: null,
    },
    signatureValid: {
      type: Boolean,
      default: false,
    },
    processingStatus: {
      type: String,
      enum: ["received", "processed", "rejected", "error"],
      default: "received",
    },
    processingNotes: {
      type: [String],
      default: [],
    },
    rawPayload: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

PayHereWebhookEventSchema.index({ orderId: 1, createdAt: -1 });
PayHereWebhookEventSchema.index({ subscriptionId: 1, createdAt: -1 });
PayHereWebhookEventSchema.index({ paymentId: 1, createdAt: -1 });
PayHereWebhookEventSchema.index({ messageType: 1, createdAt: -1 });

export default models.PayHereWebhookEvent ||
  model("PayHereWebhookEvent", PayHereWebhookEventSchema);
