export type Gender = "Male" | "Female" | "Other";

export type ActivityLevel =
  | "Sedentary"
  | "Light"
  | "Moderate"
  | "Active"
  | "Very Active";

export type Goal =
  | "Weight Loss"
  | "Muscle Gain"
  | "Maintenance"
  | "Body Transformation";

export interface HealthInput {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
  proteinIntake: number; // g
  caloriesIntake: number; // kcal
}

export interface HealthResult {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  calorieNeeds: number;
  proteinNeeds: number;
  status: {
    protein: "low" | "optimal" | "high";
    calories: "low" | "optimal" | "high";
  };
}

export function calculateHealth(data: HealthInput): HealthResult {
  const {
    weight,
    height,
    age,
    gender,
    activityLevel,
    goal,
    proteinIntake,
    caloriesIntake,
  } = data;

  /* ----------------------------------------
     1. BMI
  ---------------------------------------- */
  const bmi = weight / Math.pow(height / 100, 2);

  /* ----------------------------------------
     2. BMR (Mifflin-St Jeor Equation)
  ---------------------------------------- */
  let bmr: number;

  if (gender === "Male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    // Female + Other → use female baseline (safe assumption)
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  /* ----------------------------------------
     3. Activity Multiplier
  ---------------------------------------- */
  const activityMap: Record<ActivityLevel, number> = {
    Sedentary: 1.2,
    Light: 1.375,
    Moderate: 1.55,
    Active: 1.725,
    "Very Active": 1.9,
  };

  const activityMultiplier = activityMap[activityLevel] || 1.55;

  /* ----------------------------------------
     4. Daily Calorie Needs
  ---------------------------------------- */
  let calorieNeeds = bmr * activityMultiplier;

  // Goal adjustment
  switch (goal) {
    case "Weight Loss":
      calorieNeeds -= 300;
      break;
    case "Muscle Gain":
      calorieNeeds += 300;
      break;
    case "Maintenance":
    case "Body Transformation":
    default:
      break;
  }

  /* ----------------------------------------
     5. Protein Requirement
     (based on goal)
  ---------------------------------------- */
  let proteinFactor = 1.6; // default

  if (goal === "Muscle Gain") proteinFactor = 2.0;
  if (goal === "Weight Loss") proteinFactor = 1.8;

  const proteinNeeds = weight * proteinFactor;

  /* ----------------------------------------
     6. Status Evaluation
  ---------------------------------------- */

  // Protein Status
  let proteinStatus: "low" | "optimal" | "high";

  if (proteinIntake < proteinNeeds * 0.8) {
    proteinStatus = "low";
  } else if (proteinIntake > proteinNeeds * 1.2) {
    proteinStatus = "high";
  } else {
    proteinStatus = "optimal";
  }

  // Calorie Status
  let calorieStatus: "low" | "optimal" | "high";

  if (caloriesIntake < calorieNeeds * 0.8) {
    calorieStatus = "low";
  } else if (caloriesIntake > calorieNeeds * 1.2) {
    calorieStatus = "high";
  } else {
    calorieStatus = "optimal";
  }

  /* ----------------------------------------
     7. BMI Category (UX improvement)
  ---------------------------------------- */
  let bmiCategory = "";

  if (bmi < 18.5) bmiCategory = "Underweight";
  else if (bmi < 25) bmiCategory = "Normal";
  else if (bmi < 30) bmiCategory = "Overweight";
  else bmiCategory = "Obese";

  /* ----------------------------------------
     8. Return Final Data
  ---------------------------------------- */
  return {
    bmi,
    bmiCategory,
    bmr,
    calorieNeeds,
    proteinNeeds,

    status: {
      protein: proteinStatus,
      calories: calorieStatus,
    },
  };
}
