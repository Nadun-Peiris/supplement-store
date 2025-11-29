import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
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

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.User || mongoose.model("User", UserSchema);
