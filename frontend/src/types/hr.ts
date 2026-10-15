export type UserRole = 'admin' | 'manager' | 'employee';

export type Employee = {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id?: string | null;
  department_name: string;
  position: string;
  salary?: number | string;
  phone?: string;
  status?: 'active' | 'inactive';
  role: UserRole;
  start_date?: string;
};

export type Department = {
  department_id: string;
  name: string;
  code: string;
  manager_employee_id?: string | null;
  manager_name?: string | null;
  employee_count?: number;
};

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type LeaveRequest = {
  leave_id: string;
  employee_id?: string;
  employee_name?: string;
  department_id?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
};

export type SalaryCluster = {
  group: string;
  centroid: number;
  count: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};
