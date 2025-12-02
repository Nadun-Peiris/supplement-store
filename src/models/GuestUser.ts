// src/models/GuestUser.ts
import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IGuestUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  billingAddress: {
    street: string;
    city: string;
    country: string;
    postcode: string;
    apartment?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GuestUserSchema = new Schema<IGuestUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, required: true },

    billingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
      postcode: { type: String, required: true },
      apartment: { type: String },
    },
  },
  { timestamps: true }
);

export default (models.GuestUser as mongoose.Model<IGuestUser>) ||
  model<IGuestUser>("GuestUser", GuestUserSchema);
