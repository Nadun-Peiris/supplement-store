// src/models/User.ts

import mongoose, { Schema, Document, models } from "mongoose";

/* ---------------------------------------------------------
   TypeScript Interface (Fixes subscription Type Errors)
--------------------------------------------------------- */
export interface IUser extends Document {
  firebaseId: string;

  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: string;

  height?: number;
  weight?: number;
  bmi?: number;
  goal?: string;
  activity?: string;
  conditions?: string;
  diet?: string;
  sleepHours?: number;
  waterIntake?: number;

  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;

  subscription: {
    id: string | null;
    active: boolean;
    nextBillingDate: Date | null;
    lemonCustomerId: string | null;
    status: string | null;
    cancelledAt: Date | null;
  };

  createdAt: Date;
}

/* ---------------------------------------------------------
   Mongoose Schema
--------------------------------------------------------- */
const UserSchema = new Schema<IUser>(
  {
    firebaseId: { type: String, required: true, unique: true },

    // Step 1
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },

    // Step 2 - Health
    height: Number,
    weight: Number,
    bmi: Number,
    goal: String,
    activity: String,
    conditions: String,
    diet: String,
    sleepHours: Number,
    waterIntake: Number,

    // Step 3 - Billing
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },

    subscription: {
      id: { type: String, default: null },
      active: { type: Boolean, default: false },
      nextBillingDate: { type: Date, default: null },
      lemonCustomerId: { type: String, default: null },
      status: { type: String, default: null },
      cancelledAt: { type: Date, default: null },
    },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/* ---------------------------------------------------------
   Export Model
   (Fixes TypeScript + avoids overwriting model)
--------------------------------------------------------- */
export default models.User ||
  mongoose.model<IUser>("User", UserSchema);
