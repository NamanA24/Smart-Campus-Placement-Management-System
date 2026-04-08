import axios, { AxiosInstance } from 'axios';
import type {
  ApplicationDTO,
  ApplicationResponseDTO,
  AuditLog,
  Company,
  FitScoreResponse,
  Job,
  RawApplication,
  StatusDistribution,
  Student,
  StudentPlacementView,
} from '../types/models';

const API_BASE_URL = 'http://localhost:8080';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add JWT token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor to handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  get instance() {
    return this.client;
  }
}

export const apiClient = new ApiClient();

// Auth API
export const authAPI = {
  login: (username: string, password: string) => {
    const encodedUsername = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password);
    return apiClient.instance.post<string>(`/auth/login?username=${encodedUsername}&password=${encodedPassword}`);
  },
  registerStudent: (data: Partial<Student> & { password?: string }) => apiClient.instance.post<Student>('/auth/register/student', data),
};

// Student API
export const studentAPI = {
  create: (data: Partial<Student> & { password?: string }) => apiClient.instance.post<Student>('/students', data),
  getAll: () => apiClient.instance.get<Student[]>('/students'),
  getPlacementView: () => apiClient.instance.get<StudentPlacementView[]>('/students/placement-view'),
  getProfile: () => apiClient.instance.get<Student>('/students/me'),
  updateMine: (data: Partial<Student>) => apiClient.instance.put<Student>('/students/me', data),
  uploadResume: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.instance.post<Student>('/students/me/resume', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  resign: () => apiClient.instance.post<Student>('/students/me/resign'),
  getFitScore: () => apiClient.instance.get<FitScoreResponse>('/students/fit-score'),
};

// Company API
export const companyAPI = {
  create: (data: { name: string; password?: string; role: string; packageOffered: number }) => apiClient.instance.post<Company>('/companies', data),
  getAll: () => apiClient.instance.get<Company[]>('/companies'),
};

// Job API
export const jobAPI = {
  create: (data: { title: string; description: string; requiredSkills?: string; company: { id: number } }) =>
    apiClient.instance.post<Job>('/jobs', data),
  getAll: () => apiClient.instance.get<Job[]>('/jobs'),
};

// Application API
export const applicationAPI = {
  create: (jobId: number) => apiClient.instance.post('/applications', { job: { id: jobId } }),
  getAll: () => apiClient.instance.get<RawApplication[]>('/applications'),
  getForPlacement: () => apiClient.instance.get<ApplicationDTO[]>('/applications/placement'),
  getByStudent: () => apiClient.instance.get<ApplicationDTO[]>('/applications/me'),
  getByCompany: () => apiClient.instance.get<ApplicationResponseDTO[]>('/applications/company'),
  getCompanyShortlist: () => apiClient.instance.get<ApplicationResponseDTO[]>('/applications/company/shortlist'),
  getCompanyShortlistByJob: (jobId: number, limit = 5, minScore = 0) =>
    apiClient.instance.get<ApplicationResponseDTO[]>(`/applications/company/shortlist/${jobId}?limit=${limit}&minScore=${minScore}`),
  verify: (id: number) => apiClient.instance.get<string>(`/applications/${id}/verify`),
  updateStatus: (id: number, status: string) => apiClient.instance.put(`/applications/${id}/status?status=${encodeURIComponent(status)}`),
  getAnalyticsTop: (jobId: number) => apiClient.instance.get<ApplicationResponseDTO[]>(`/applications/analytics/top?jobId=${jobId}`),
  getAnalyticsAverage: (jobId: number) => apiClient.instance.get<number>(`/applications/analytics/average/${jobId}`),
  getAnalyticsSelectionRatio: (jobId: number) => apiClient.instance.get<number>(`/applications/analytics/selection-ratio/${jobId}`),
  getAnalyticsStatus: (jobId: number) => apiClient.instance.get<StatusDistribution>(`/applications/analytics/status/${jobId}`),
};

// TPA API
export const tpaAPI = {
  runAudit: () => apiClient.instance.get<string[]>('/tpa/audit'),
};

// Audit API
export const auditAPI = {
  getAll: () => apiClient.instance.get<AuditLog[]>('/audit'),
};
