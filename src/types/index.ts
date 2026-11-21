// Backend-এর response-এর আকার (backend-এর সাথে মিল রাখা)

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiList<T> {
  success: true;
  data: T[];
  pagination: Pagination;
}

export interface ApiItem<T> {
  success: true;
  data: T;
}

export interface ApiMessage {
  success: true;
  message: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  // শুধু doctors তালিকায় আসে
  patientCount?: number;
}

export type Gender = "male" | "female" | "other";

export interface DoctorRef {
  _id: string;
  name: string;
  specialization: string;
}

export interface Patient {
  _id: string;
  name: string;
  age: number;
  gender?: Gender;
  phone: string;
  condition: string;
  notes?: string;
  // ISO তারিখ; শুধু দিন দরকার হলে .slice(0, 10)
  visitDate: string;
  doctor: DoctorRef;
  createdAt: string;
  updatedAt: string;
}

export interface HealthResponse {
  status: string;
  db: "connected" | "disconnected";
  uptime: number;
}

// Dashboard-এ কত দিনের হিসাব দেখানো হবে
export type DashboardRange = 7 | 30 | 90;

// বর্তমান মান আর তুলনার (আগের সময়ের) মান
export interface Comparison {
  current: number;
  previous: number;
}

export interface DashboardStats {
  range: DashboardRange;
  totals: { doctors: number; patients: number };
  visits: {
    today: Comparison;
    period: Comparison;
    averagePerDay: Comparison;
  };
  patientsPerDoctor: Array<{ doctorId: string; name: string; specialization: string; count: number }>;
  patientsByDay: Array<{ date: string; count: number }>;
  conditions: Array<{ condition: string; count: number }>;
  timezone: string;
  generatedAt: string;
}
