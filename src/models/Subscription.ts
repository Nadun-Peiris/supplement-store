import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  lemonSubscriptionId: string;
  lemonCustomerId: string;
  status: string;
  renewsAt?: Date | null;
  endsAt?: Date | null;
  cancelledAt?: Date | null;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },

    lemonSubscriptionId: { type: String, required: true, unique: true },
    lemonCustomerId: { type: String, required: true },

    status: { type: String, required: true },

    renewsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default (models.Subscription as mongoose.Model<ISubscription>) ||
  model<ISubscription>("Subscription", SubscriptionSchema);
