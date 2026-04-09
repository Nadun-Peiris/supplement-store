import mongoose from "mongoose";

const HealthLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 Now stores exact time (not normalized)
    date: {
      type: Date,
      default: Date.now,
    },

    /* ----------------------------------------
       Daily Inputs
    ---------------------------------------- */
    weight: Number,
    proteinIntake: Number,
    caloriesIntake: Number,
    waterIntake: Number,
    sleepHours: Number,

    /* ----------------------------------------
       Snapshot (from user)
    ---------------------------------------- */
    age: Number,
    gender: String,
    height: Number,
    goal: String,
    activity: String,

    /* ----------------------------------------
       Calculated
    ---------------------------------------- */
    bmi: Number,
    bmr: Number,
    calorieNeeds: Number,
    proteinNeeds: Number,

    status: {
      protein: String,
      calories: String,
    },
  },
  { timestamps: true }
);

// ✅ NO UNIQUE INDEX (allows multiple logs per day)
HealthLogSchema.index({ userId: 1, date: 1 });

export default mongoose.models.HealthLog ||
  mongoose.model("HealthLog", HealthLogSchema);