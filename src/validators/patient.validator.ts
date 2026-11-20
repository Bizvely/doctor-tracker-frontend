import { z } from "zod";
import { PATIENT_CONDITIONS, PATIENT_GENDERS } from "../models/Patient";

// ফাঁকা string এলে "দেওয়া হয়নি" ধরা
const emptyToUndefined = (value: unknown): unknown => (value === "" ? undefined : value);

// সত্যিকারের তারিখ কিনা (যেমন 2026-02-31 বাতিল) এবং যুক্তিসঙ্গত সীমার মধ্যে কিনা
function isRealDate(value: string): boolean {
  if (value < "2000-01-01" || value > "2100-12-31") return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine(isRealDate, "Invalid date");

const optionalDate = z.preprocess(emptyToUndefined, dateString.optional());

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const optionalObjectId = z.preprocess(emptyToUndefined, objectIdString.optional());

// রোগীর সাধারণ field (ডাক্তারের তথ্য ছাড়া)
const patientFieldsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  age: z.number().int().min(0).max(120),
  gender: z.preprocess(emptyToUndefined, z.enum(PATIENT_GENDERS).optional()),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{5,18}$/, "Invalid phone number")
    .transform((value) => value.replace(/[\s-]/g, "")),
  condition: z.enum(PATIENT_CONDITIONS),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
  // "2026-11-20" থেকে UTC মধ্যরাতের Date বানানো
  visitDate: dateString.transform((value) => new Date(`${value}T00:00:00.000Z`)),
});

// ডাক্তারের পাতা থেকে রোগী যোগ: ডাক্তার URL থেকে আসে, তাই body-তে doctorId পাঠালে 400
export const doctorPatientSchema = patientFieldsSchema.strict();

// Patients পাতা থেকে রোগী তৈরি/edit: doctorId বাধ্যতামূলক
export const patientSchema = patientFieldsSchema.extend({ doctorId: objectIdString }).strict();

export type PatientFields = z.infer<typeof patientFieldsSchema>;
export type PatientInput = z.infer<typeof patientSchema>;

// তালিকার URL query যাচাই (ভুল ধরনের মান যেমন search[$ne]=x বাতিল হয়)
const listBase = z.object({
  search: z.string().trim().max(60).optional(),
  condition: z.preprocess(emptyToUndefined, z.enum(PATIENT_CONDITIONS).optional()),
  from: optionalDate,
  to: optionalDate,
  sort: z.enum(["newest", "oldest", "name"]).default("newest"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const dateOrderCheck = (data: { from?: string; to?: string }): boolean =>
  !data.from || !data.to || data.from <= data.to;
const dateOrderIssue = { message: "from date must be before to date", path: ["from"] };

export const listPatientsQuerySchema = listBase
  .extend({ doctorId: optionalObjectId })
  .strict()
  .refine(dateOrderCheck, dateOrderIssue);

export const listDoctorPatientsQuerySchema = listBase.strict().refine(dateOrderCheck, dateOrderIssue);

export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;
export type ListDoctorPatientsQuery = z.infer<typeof listDoctorPatientsQuerySchema>;
