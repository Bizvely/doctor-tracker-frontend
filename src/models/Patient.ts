import { Schema, model } from "mongoose";

// রোগের নির্দিষ্ট তালিকা। নতুন রোগ যোগ করতে হলে শুধু এখানে বদলালেই হবে (frontend API থেকে নেয়)
export const PATIENT_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Heart Disease",
  "Arthritis",
  "Migraine",
  "Allergy",
  "Infection",
  "Fever",
  "Injury",
  "Other",
] as const;

export const PATIENT_GENDERS = ["male", "female", "other"] as const;

const patientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, enum: [...PATIENT_GENDERS] },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    condition: { type: String, required: true, enum: [...PATIENT_CONDITIONS] },
    notes: { type: String, trim: true, maxlength: 500 },
    // শুধু তারিখ (সময় ছাড়া): UTC মধ্যরাত হিসেবে রাখা হয়, তাই তারিখ কখনো এদিক-ওদিক হয় না
    visitDate: { type: Date, required: true },
    // কোন ডাক্তারের রোগী (Doctor collection-এর সাথে সংযোগ)
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  },
  { timestamps: true, versionKey: false }
);

// Index: ডাক্তারের রোগী তারিখ অনুযায়ী, রোগ অনুযায়ী filter, তারিখ অনুযায়ী sort, নাম দিয়ে খোঁজা
// (doctor+visitDate index "doctor" দিয়ে খোঁজাও দ্রুত করে, তাই আলাদা doctor index লাগে না)
patientSchema.index({ doctor: 1, visitDate: -1 });
patientSchema.index({ condition: 1, visitDate: -1 });
patientSchema.index({ visitDate: -1 });
patientSchema.index({ name: 1 });

export const Patient = model("Patient", patientSchema);
