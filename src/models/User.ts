import mongoose, {
  Schema,
  Document,
  models,
  type Model,
  type Types,
} from "mongoose";

/* ---------------------------------------------------------
   TypeScript Interface
--------------------------------------------------------- */
export interface IUser extends Document {
  _id: Types.ObjectId;
  firebaseId: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other"; // Strict types

  height?: number;
  weight?: number;
  bmi?: number;
  goal?: "Weight Loss" | "Muscle Gain" | "Maintenance" | "Body Transformation";
  activity?: "Sedentary" | "Light" | "Moderate" | "Active" | "Very Active";
  conditions?: string;
  diet?: "Standard" | "Keto" | "Vegan" | "Vegetarian" | "Paleo";
  sleepHours?: number;
  waterIntake?: number;

  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;

  subscription: {
    subscriptionId: string | null; // Changed to match PayHere logic
    active: boolean;
    nextBillingDate: Date | null;
    status: "active" | "cancelled" | "completed" | null;
    lastPaymentDate: Date | null;
  };

  role: "customer" | "admin" | "superadmin";
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/* ---------------------------------------------------------
   Mongoose Schema
--------------------------------------------------------- */
const UserSchema = new Schema<IUser>(
  {
    firebaseId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: { type: String, required: true, unique: true },
    age: { type: Number, required: true },
    
    // 🔐 ENFORCED DROPDOWN OPTIONS
    gender: { 
      type: String, 
      required: true, 
      enum: ["Male", "Female", "Other"] 
    },

    // Step 2 - Health (Enforced Enums)
    height: Number,
    weight: Number,
    bmi: Number,
    goal: { 
      type: String, 
      enum: ["Weight Loss", "Muscle Gain", "Maintenance", "Body Transformation"],
    },
    activity: { 
      type: String, 
      enum: ["Sedentary", "Light", "Moderate", "Active", "Very Active"],
    },
    diet: { 
      type: String, 
      enum: ["Standard", "Keto", "Vegan", "Vegetarian", "Paleo"],
      default: "Standard"
    },
    
    conditions: { type: String, default: "" },
    sleepHours: { type: Number },
    waterIntake: { type: Number },

    // Step 3 - Billing
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "Sri Lanka" },

    subscription: {
      subscriptionId: { type: String, default: null },
      active: { type: Boolean, default: false },
      nextBillingDate: { type: Date, default: null },
      status: { 
        type: String, 
        enum: ["active", "cancelled", "completed", null], 
        default: null 
      },
      lastPaymentDate: { type: Date, default: null },
    },

    role: {
      type: String,
      enum: ["customer", "admin", "superadmin"],
      default: "customer",
    },

    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });

const User: Model<IUser> =
  (models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
