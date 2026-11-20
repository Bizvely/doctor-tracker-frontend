import { Types } from "mongoose";
import { Doctor } from "../models/Doctor";
import { PATIENT_CONDITIONS, PATIENT_GENDERS, Patient } from "../models/Patient";
import type {
  ListDoctorPatientsQuery,
  ListPatientsQuery,
  PatientFields,
  PatientInput,
} from "../validators/patient.validator";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { assertObjectId, dhakaDateRange, escapeRegex } from "../utils/queryHelpers";

const SORT_OPTIONS = {
  newest: { visitDate: -1, _id: -1 },
  oldest: { visitDate: 1, _id: 1 },
  name: { name: 1, _id: 1 },
} as const;

interface PatientFilterInput {
  search?: string;
  condition?: string;
  doctorId?: string;
  from?: string;
  to?: string;
}

// Filter শুধু যাচাই করা মান দিয়ে বানানো (সরাসরি user-এর object কখনো Mongo-তে যায় না)
function buildPatientFilter(query: PatientFilterInput): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ name: pattern }, { phone: pattern }];
  }
  if (query.condition) filter.condition = query.condition;
  if (query.doctorId) filter.doctor = new Types.ObjectId(query.doctorId);

  const visitDate = dhakaDateRange(query.from, query.to);
  if (visitDate) filter.visitDate = visitDate;

  return filter;
}

// তালিকা + মোট সংখ্যা একসাথে। populate মানে ডাক্তারের নাম আনা:
// Mongoose এটা মাত্র ১টা বাড়তি query-তে করে (প্রতি রোগীর জন্য আলাদা নয়)
async function fetchPatientList(
  filter: Record<string, unknown>,
  sort: keyof typeof SORT_OPTIONS,
  page: number,
  limit: number
) {
  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .sort(SORT_OPTIONS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("doctor", "name specialization")
      .lean(),
    Patient.countDocuments(filter),
  ]);

  return {
    success: true,
    data: patients,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

// ডাক্তার আছে কিনা দেখা (না থাকলে 404)
async function assertDoctorExists(id: string): Promise<void> {
  assertObjectId(id);
  const doctor = await Doctor.findById(id).select("_id").lean();
  if (!doctor) throw new ApiError(404, "Doctor not found");
}

// ঐচ্ছিক field (gender, notes) ফাঁকা হলে database থেকে মুছে ফেলার জন্য $set ও $unset আলাদা করা
function splitOptionalFields(fields: PatientFields) {
  const { gender, notes, ...required } = fields;
  const set: Record<string, unknown> = { ...required };
  const unset: Record<string, ""> = {};

  if (gender) set.gender = gender;
  else unset.gender = "";

  if (notes) set.notes = notes;
  else unset.notes = "";

  return { set, unset };
}

// ---------- সব রোগীর তালিকা (Patients পাতা) ----------

export const listPatients = asyncHandler(async (_req, res) => {
  const query = res.locals.query as ListPatientsQuery;
  const result = await fetchPatientList(buildPatientFilter(query), query.sort, query.page, query.limit);
  res.json(result);
});

// Dropdown-এর জন্য: রোগের তালিকা, gender ও ডাক্তারদের (id + নাম) তালিকা
export const getPatientOptions = asyncHandler(async (_req, res) => {
  const doctors = await Doctor.find().select("name specialization").sort({ name: 1 }).limit(500).lean();
  res.json({
    success: true,
    data: { conditions: PATIENT_CONDITIONS, genders: PATIENT_GENDERS, doctors },
  });
});

export const getPatient = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const patient = await Patient.findById(req.params.id).populate("doctor", "name specialization").lean();
  if (!patient) throw new ApiError(404, "Patient not found");
  res.json({ success: true, data: patient });
});

export const createPatient = asyncHandler(async (req, res) => {
  const { doctorId, ...fields } = req.body as PatientInput;
  await assertDoctorExists(doctorId);
  const patient = await Patient.create({ ...fields, doctor: new Types.ObjectId(doctorId) });
  res.status(201).json({ success: true, data: patient });
});

export const updatePatient = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const { doctorId, ...fields } = req.body as PatientInput;
  await assertDoctorExists(doctorId);

  const { set, unset } = splitOptionalFields(fields);
  set.doctor = new Types.ObjectId(doctorId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = { $set: set };
  if (Object.keys(unset).length > 0) update.$unset = unset;

  const patient = await Patient.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  })
    .populate("doctor", "name specialization")
    .lean();

  if (!patient) throw new ApiError(404, "Patient not found");
  res.json({ success: true, data: patient });
});

export const deletePatient = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const deleted = await Patient.findByIdAndDelete(req.params.id).lean();
  if (!deleted) throw new ApiError(404, "Patient not found");
  res.json({ success: true, message: "Patient deleted" });
});

// ---------- একজন ডাক্তারের রোগী (ডাক্তারের detail পাতা) ----------

export const listDoctorPatients = asyncHandler(async (req, res) => {
  const query = res.locals.query as ListDoctorPatientsQuery;
  await assertDoctorExists(req.params.id);
  const filter = buildPatientFilter({ ...query, doctorId: req.params.id });
  const result = await fetchPatientList(filter, query.sort, query.page, query.limit);
  res.json(result);
});

export const createDoctorPatient = asyncHandler(async (req, res) => {
  await assertDoctorExists(req.params.id);
  const patient = await Patient.create({
    ...(req.body as PatientFields),
    doctor: new Types.ObjectId(req.params.id),
  });
  res.status(201).json({ success: true, data: patient });
});

// শুধু ওই ডাক্তারের রোগীই মুছবে (অন্য ডাক্তারের রোগীর id দিলে 404)
export const deleteDoctorPatient = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  assertObjectId(req.params.patientId);
  const deleted = await Patient.findOneAndDelete({
    _id: new Types.ObjectId(req.params.patientId),
    doctor: new Types.ObjectId(req.params.id),
  }).lean();
  if (!deleted) throw new ApiError(404, "Patient not found for this doctor");
  res.json({ success: true, message: "Patient removed from doctor's list" });
});
