import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IHealthLog extends Document {
  userId: string;
  date: string; 
  weight?: number;
  waterIntake?: number;
  sleepHours?: number;
  bmi?: number;
  height?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  workout?: {
    type: string;
    duration: number;
    notes?: string;
  };
  supplements: {
    name: string;
    dose: string;
    taken: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const HealthLogSchema = new Schema<IHealthLog>(
  {
    userId: { type: String, required: true, index: true },
    date:   { type: String, required: true }, 

    weight:     { type: Number, default: null },
    waterIntake:{ type: Number, default: null },
    sleepHours: { type: Number, default: null },
    bmi:        { type: Number, default: null },
    height:     { type: Number, default: null },
    bodyFat:    { type: Number, default: null },
    chest:      { type: Number, default: null },
    waist:      { type: Number, default: null },
    hips:       { type: Number, default: null },

    // Improved Workout Schema
    workout: {
      type: { 
        type: String, 
        enum: ["Gym", "Cardio", "Yoga", "Swimming", "Cycling", "Rest", "Other", ""],
        default: "" 
      },
      duration: { type: Number, default: 0 },
      notes: { type: String, default: "" },
    },

    supplements: [
      {
        name:  { type: String, required: true },
        dose:  { type: String, required: true },
        taken: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

// Unique index to prevent duplicate daily entries
HealthLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// ─── Middleware: Auto-calculate BMI ───
HealthLogSchema.pre("save", function (next) {
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    this.bmi = Number((this.weight / (heightInMeters * heightInMeters)).toFixed(2));
  }
  next();
});

export default (models.HealthLog as mongoose.Model<IHealthLog>) ||
  model<IHealthLog>("HealthLog", HealthLogSchema);