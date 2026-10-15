import { apiClient } from './api-client';

import type { Department, Employee, LeaveRequest, SalaryCluster } from '@/types/hr';

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

  async getLeaveRequests(token: string): Promise<LeaveRequest[]> {
    const res = await apiClient<LeaveRequest[] | { leaveRequests: LeaveRequest[] }>('/api/leave-requests', { token });
    return Array.isArray(res) ? res : res.leaveRequests ?? [];
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

  createEmployee(token: string, input: Record<string, unknown>) {
    return apiClient<Employee>('/api/employees', { method: 'POST', token, body: JSON.stringify(input) });
  },

  updateEmployee(token: string, employeeId: string, input: Record<string, unknown>) {
    return apiClient<Employee>(`/api/employees/${employeeId}`, { method: 'PUT', token, body: JSON.stringify(input) });
  },

  updateEmployeeStatus(token: string, employeeId: string, status: 'active' | 'inactive') {
    return apiClient<Employee>(`/api/employees/${employeeId}/status`, { method: 'PATCH', token, body: JSON.stringify({ status }) });
  },

  async getDepartments(token: string): Promise<Department[]> {
    const res = await apiClient<Department[] | { departments: Department[] }>('/api/departments', { token });
    return Array.isArray(res) ? res : res.departments ?? [];
  },

  createDepartment(token: string, input: Record<string, unknown>) {
    return apiClient<Department>('/api/departments', { method: 'POST', token, body: JSON.stringify(input) });
  },

  updateDepartment(token: string, departmentId: string, input: Record<string, unknown>) {
    return apiClient<Department>(`/api/departments/${departmentId}`, { method: 'PUT', token, body: JSON.stringify(input) });
  },

  deleteDepartment(token: string, departmentId: string) {
    return apiClient<void>(`/api/departments/${departmentId}`, { method: 'DELETE', token });
  },

  updateLeaveRequest(token: string, leaveId: string, input: Record<string, unknown>) {
    return apiClient<LeaveRequest>(`/api/leave-requests/${leaveId}`, { method: 'PUT', token, body: JSON.stringify(input) });
  },

  cancelLeaveRequest(token: string, leaveId: string) {
    return apiClient<LeaveRequest>(`/api/leave-requests/${leaveId}/cancel`, { method: 'PATCH', token });
  },

  decideLeaveRequest(token: string, leaveId: string, status: 'approved' | 'rejected') {
    return apiClient<LeaveRequest>(`/api/leave-requests/${leaveId}/decision`, { method: 'PATCH', token, body: JSON.stringify({ status }) });
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
