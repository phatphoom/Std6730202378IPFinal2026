import { apiClient } from './api-client';

import type { Employee, LeaveRequest, SalaryCluster } from '@/types/hr';

export type AttendanceRecord = {
  attendance_id: string;
  employee_id: string;
  employee_name?: string;
  department_id?: string;
  check_in_time: string;
  check_out_time: string | null;
  created_at?: string;
  updated_at?: string;
};

export const hrApi = {
  login(email: string, password: string) {
    return apiClient<{ token: string; user: Employee }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMyAttendance(token: string): Promise<AttendanceRecord[]> {
    const res = await apiClient<AttendanceRecord[] | { attendance: AttendanceRecord[] }>(
      '/api/attendance/me',
      { token },
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.attendance)) return res.attendance;
    return [];
  },

  checkIn(token: string, recorded_at?: string) {
    return apiClient<AttendanceRecord>('/api/attendance/check-in', {
      method: 'POST',
      token,
      body: JSON.stringify(recorded_at ? { recorded_at } : {}),
    });
  },

  checkOut(token: string, recorded_at?: string) {
    return apiClient<AttendanceRecord>('/api/attendance/check-out', {
      method: 'POST',
      token,
      body: JSON.stringify(recorded_at ? { recorded_at } : {}),
    });
  },

  async getMyLeaveRequests(token: string): Promise<LeaveRequest[]> {
    const res = await apiClient<LeaveRequest[] | { leaveRequests: LeaveRequest[] }>(
      '/api/leave-requests/me',
      { token },
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.leaveRequests)) return res.leaveRequests;
    return [];
  },

  createLeaveRequest(token: string, request: Omit<LeaveRequest, 'leave_id' | 'status'>) {
    return apiClient<LeaveRequest>('/api/leave-requests', {
      method: 'POST',
      token,
      body: JSON.stringify(request),
    });
  },

  async getEmployees(token: string): Promise<Employee[]> {
    const res = await apiClient<Employee[] | { employees: Employee[] }>('/api/employees', {
      token,
    });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.employees)) return res.employees;
    return [];
  },

  async getSalaryClusters(): Promise<SalaryCluster[]> {
    const res = await apiClient<SalaryCluster[] | { clusters: SalaryCluster[] }>(
      '/api/employees/salary-clusters',
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).clusters)) return (res as any).clusters;
    return [];
  },
};
