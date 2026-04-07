export type UserRole = 'STUDENT' | 'COMPANY' | 'ADMIN' | 'PLACEMENT';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  branch: string;
  cgpa: number;
  skills: string;
  projects: string;
  resumeLink: string;
  phone: string;
  university: string;
  graduationYear: number;
  signedAt?: string;
  integrityStatus?: 'CLEAN' | 'TAMPERED' | 'UNSIGNED' | string;
}

export interface Company {
  id: number;
  name: string;
  role: string;
  packageOffered: number;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  requiredSkills?: string;
  company: Company;
}

export interface ApplicationDTO {
  studentName: string;
  jobTitle: string;
  status: string;
}

export interface RawApplication {
  id: number;
  status: string;
  student: {
    name: string;
  };
  job: {
    title: string;
  };
}

export interface ApplicationResponseDTO {
  applicationId: number;
  studentName: string;
  jobTitle: string;
  fitScore: number;
  level: string;
  status: string;
  signature: string;
  verification: string;
}

export interface FitScoreResponse {
  score: number;
  level: string;
  signature: string;
  payload: string;
}

export interface AuditLog {
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface StatusDistribution {
  applied: number;
  shortlisted: number;
  rejected: number;
  total: number;
}
