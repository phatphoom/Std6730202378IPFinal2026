import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HrScreen, SectionCard } from '@/components/hr/screen';
import { HrColors, HrFont, HrRadius } from '@/constants/hr-theme';
import { useAuth } from '@/context/auth-context';
import { hrApi } from '@/services/hr-api';
import type { Department, Employee, LeaveRequest, UserRole } from '@/types/hr';

type EmployeeForm = { first_name: string; last_name: string; email: string; password: string; phone: string; department_id: string; position: string; salary: string; role: UserRole; start_date: string };
type DepartmentForm = { name: string; code: string; manager_employee_id: string };
const emptyEmployee: EmployeeForm = { first_name: '', last_name: '', email: '', password: '', phone: '', department_id: '', position: '', salary: '', role: 'employee', start_date: '' };
const emptyDepartment: DepartmentForm = { name: '', code: '', manager_employee_id: '' };

export function ManagementScreen() {
  const { session } = useAuth();
  const isAdmin = session?.user.role === 'admin';
  const canReview = isAdmin || session?.user.role === 'manager';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeForm, setEmployeeForm] = useState<EmployeeForm>(emptyEmployee);
  const [departmentForm, setDepartmentForm] = useState<DepartmentForm>(emptyDepartment);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [showEmployee, setShowEmployee] = useState(false);
  const [showDepartment, setShowDepartment] = useState(false);

  const token = session?.token;
  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true); setError(null);
    try {
      const [emps, depts] = await Promise.all([hrApi.getEmployees(token), hrApi.getDepartments(token)]);
      setEmployees(emps); setDepartments(depts);
      if (canReview) setLeaves(await hrApi.getLeaveRequests(token));
    } catch (e) { setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ'); }
    finally { setBusy(false); }
  }, [token, canReview]);

  useEffect(() => { load(); }, [load]);

  const managerOptions = useMemo(() => employees.filter((e) => e.role === 'manager' || e.role === 'admin'), [employees]);
  const openCreateEmployee = () => { setEditingEmployee(null); setEmployeeForm(emptyEmployee); setShowEmployee(true); };
  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeForm({ first_name: emp.first_name, last_name: emp.last_name, email: emp.email, password: '', phone: emp.phone ?? '', department_id: emp.department_id ?? '', position: emp.position ?? '', salary: emp.salary == null ? '' : String(emp.salary), role: emp.role, start_date: emp.start_date ?? '' });
    setShowEmployee(true);
  };
  const saveEmployee = async () => {
    if (!token || !employeeForm.first_name.trim() || !employeeForm.last_name.trim() || !employeeForm.email.trim() || (!editingEmployee && employeeForm.password.length < 6)) { setError('กรุณากรอกข้อมูลพนักงานให้ครบ และรหัสผ่านอย่างน้อย 6 ตัวอักษร'); return; }
    try {
      const payload: Record<string, unknown> = { ...employeeForm, salary: employeeForm.salary ? Number(employeeForm.salary) : 0, department_id: employeeForm.department_id || null, start_date: employeeForm.start_date || null };
      if (editingEmployee) { delete payload.password; const updated = await hrApi.updateEmployee(token, editingEmployee.employee_id, payload); setEmployees((v) => v.map((x) => x.employee_id === updated.employee_id ? updated : x)); }
      else { const created = await hrApi.createEmployee(token, payload); setEmployees((v) => [created, ...v]); }
      setShowEmployee(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'บันทึกพนักงานไม่สำเร็จ'); }
  };
  const toggleEmployee = (emp: Employee) => {
    if (!token) return;
    Alert.alert('เปลี่ยนสถานะพนักงาน', `ต้องการ ${emp.status === 'active' ? 'พักงาน' : 'เปิดใช้งาน'} ${emp.first_name} หรือไม่`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ยืนยัน', onPress: async () => { try { const updated = await hrApi.updateEmployeeStatus(token, emp.employee_id, emp.status === 'active' ? 'inactive' : 'active'); setEmployees((v) => v.map((x) => x.employee_id === updated.employee_id ? updated : x)); } catch (e) { setError(e instanceof Error ? e.message : 'เปลี่ยนสถานะไม่สำเร็จ'); } } },
    ]);
  };
  const saveDepartment = async () => {
    if (!token || !departmentForm.name.trim() || !departmentForm.code.trim()) { setError('กรุณากรอกชื่อและรหัสแผนก'); return; }
    try {
      const payload = { name: departmentForm.name.trim(), code: departmentForm.code.trim(), manager_employee_id: departmentForm.manager_employee_id || null };
      if (editingDepartment) { const updated = await hrApi.updateDepartment(token, editingDepartment.department_id, payload); setDepartments((v) => v.map((x) => x.department_id === updated.department_id ? updated : x)); }
      else { const created = await hrApi.createDepartment(token, payload); setDepartments((v) => [created, ...v]); }
      setShowDepartment(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'บันทึกแผนกไม่สำเร็จ'); }
  };
  const removeDepartment = (dept: Department) => {
    if (!token) return;
    Alert.alert('ลบแผนก', `ต้องการลบ ${dept.name} หรือไม่`, [{ text: 'ยกเลิก', style: 'cancel' }, { text: 'ลบ', style: 'destructive', onPress: async () => { try { await hrApi.deleteDepartment(token, dept.department_id); setDepartments((v) => v.filter((x) => x.department_id !== dept.department_id)); } catch (e) { setError(e instanceof Error ? e.message : 'ลบแผนกไม่สำเร็จ'); } } }]);
  };
  const decideLeave = (leave: LeaveRequest, status: 'approved' | 'rejected') => {
    if (!token) return;
    Alert.alert(status === 'approved' ? 'อนุมัติคำขอ' : 'ไม่อนุมัติคำขอ', undefined, [{ text: 'ยกเลิก', style: 'cancel' }, { text: 'ยืนยัน', onPress: async () => { try { const updated = await hrApi.decideLeaveRequest(token, leave.leave_id, status); setLeaves((v) => v.map((x) => x.leave_id === updated.leave_id ? updated : x)); } catch (e) { setError(e instanceof Error ? e.message : 'อัปเดตคำขอไม่สำเร็จ'); } } }]);
  };

  return <HrScreen title="จัดการระบบ" subtitle="จัดการข้อมูลตามสิทธิ์ของผู้ใช้งาน" headerVariant="hero" action={<Pressable onPress={load}><Ionicons name="refresh" size={22} color="#fff" /></Pressable>}>
    {!isAdmin && <Text style={styles.note}>คุณมีสิทธิ์ดูแลพนักงานในขอบเขตที่ backend อนุญาต</Text>}
    {error && <View style={styles.error}><Text style={styles.errorText}>⚠ {error}</Text></View>}
    {busy && <ActivityIndicator color={HrColors.blue} />}
    <SectionCard><View style={styles.sectionHead}><Text style={styles.heading}>พนักงาน ({employees.length})</Text>{isAdmin && <SmallButton title="เพิ่มพนักงาน" onPress={openCreateEmployee} />}</View>{employees.map((emp) => <View style={styles.row} key={emp.employee_id}><View style={styles.rowMain}><Text style={styles.bold}>{emp.first_name} {emp.last_name}</Text><Text style={styles.muted}>{emp.email} · {emp.role} · {emp.status}</Text></View>{isAdmin && <><SmallButton title="แก้ไข" onPress={() => openEditEmployee(emp)} /><SmallButton title={emp.status === 'active' ? 'พักงาน' : 'เปิดใช้'} onPress={() => toggleEmployee(emp)} /></>}</View>)}</SectionCard>
    {isAdmin && <SectionCard><View style={styles.sectionHead}><Text style={styles.heading}>แผนก ({departments.length})</Text><SmallButton title="เพิ่มแผนก" onPress={() => { setEditingDepartment(null); setDepartmentForm(emptyDepartment); setShowDepartment(true); }} /></View>{departments.map((dept) => <View style={styles.row} key={dept.department_id}><View style={styles.rowMain}><Text style={styles.bold}>{dept.name} ({dept.code})</Text><Text style={styles.muted}>ผู้จัดการ: {dept.manager_name || 'ยังไม่ระบุ'}</Text></View><SmallButton title="แก้ไข" onPress={() => { setEditingDepartment(dept); setDepartmentForm({ name: dept.name, code: dept.code, manager_employee_id: dept.manager_employee_id || '' }); setShowDepartment(true); }} /><SmallButton title="ลบ" danger onPress={() => removeDepartment(dept)} /></View>)}</SectionCard>}
    {canReview && <SectionCard><Text style={styles.heading}>อนุมัติคำขอลา ({leaves.filter((x) => x.status === 'pending').length})</Text>{leaves.filter((x) => x.status === 'pending').map((leave) => <View style={styles.leaveRow} key={leave.leave_id}><View style={styles.rowMain}><Text style={styles.bold}>{leave.employee_name || leave.employee_id || 'พนักงาน'} · {leave.leave_type}</Text><Text style={styles.muted}>{leave.start_date} ถึง {leave.end_date} · {leave.reason}</Text></View><SmallButton title="อนุมัติ" onPress={() => decideLeave(leave, 'approved')} /><SmallButton title="ปฏิเสธ" danger onPress={() => decideLeave(leave, 'rejected')} /></View>)}</SectionCard>}
    <EmployeeModal visible={showEmployee} form={employeeForm} setForm={setEmployeeForm} editing={!!editingEmployee} onClose={() => setShowEmployee(false)} onSave={saveEmployee} />
    <DepartmentModal visible={showDepartment} form={departmentForm} setForm={setDepartmentForm} managers={managerOptions} editing={!!editingDepartment} onClose={() => setShowDepartment(false)} onSave={saveDepartment} />
  </HrScreen>;
}

function SmallButton({ title, onPress, danger = false }: { title: string; onPress: () => void; danger?: boolean }) { return <Pressable style={[styles.smallButton, danger && styles.dangerButton]} onPress={onPress}><Text style={styles.smallButtonText}>{title}</Text></Pressable>; }
function Field({ label, value, onChangeText, secureTextEntry = false, placeholder }: { label: string; value: string; onChangeText: (v: string) => void; secureTextEntry?: boolean; placeholder?: string }) { return <View><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry} placeholder={placeholder} style={styles.input} /></View>; }
function EmployeeModal({ visible, form, setForm, editing, onClose, onSave }: { visible: boolean; form: EmployeeForm; setForm: React.Dispatch<React.SetStateAction<EmployeeForm>>; editing: boolean; onClose: () => void; onSave: () => void }) { return <Modal visible={visible} transparent animationType="slide"><View style={styles.overlay}><View style={styles.modal}><ScrollView><Text style={styles.modalTitle}>{editing ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}</Text><Field label="ชื่อ" value={form.first_name} onChangeText={(v) => setForm((x) => ({ ...x, first_name: v }))} /><Field label="นามสกุล" value={form.last_name} onChangeText={(v) => setForm((x) => ({ ...x, last_name: v }))} /><Field label="อีเมล" value={form.email} onChangeText={(v) => setForm((x) => ({ ...x, email: v }))} /><Field label={editing ? 'รหัสผ่าน (ไม่ต้องกรอกถ้าไม่เปลี่ยน)' : 'รหัสผ่าน'} value={form.password} onChangeText={(v) => setForm((x) => ({ ...x, password: v }))} secureTextEntry /><Field label="โทรศัพท์" value={form.phone} onChangeText={(v) => setForm((x) => ({ ...x, phone: v }))} /><Field label="Department ID" value={form.department_id} onChangeText={(v) => setForm((x) => ({ ...x, department_id: v }))} /><Field label="ตำแหน่ง" value={form.position} onChangeText={(v) => setForm((x) => ({ ...x, position: v }))} /><Field label="เงินเดือน" value={form.salary} onChangeText={(v) => setForm((x) => ({ ...x, salary: v }))} /><Field label="Role (admin/manager/employee)" value={form.role} onChangeText={(v) => setForm((x) => ({ ...x, role: v as UserRole }))} /><Field label="วันเริ่มงาน (YYYY-MM-DD)" value={form.start_date} onChangeText={(v) => setForm((x) => ({ ...x, start_date: v }))} /><View style={styles.modalActions}><SmallButton title="ยกเลิก" onPress={onClose} /><SmallButton title="บันทึก" onPress={onSave} /></View></ScrollView></View></View></Modal>; }
function DepartmentModal({ visible, form, setForm, managers, editing, onClose, onSave }: { visible: boolean; form: DepartmentForm; setForm: React.Dispatch<React.SetStateAction<DepartmentForm>>; managers: Employee[]; editing: boolean; onClose: () => void; onSave: () => void }) { return <Modal visible={visible} transparent animationType="slide"><View style={styles.overlay}><View style={styles.modal}><ScrollView><Text style={styles.modalTitle}>{editing ? 'แก้ไขแผนก' : 'เพิ่มแผนก'}</Text><Field label="ชื่อแผนก" value={form.name} onChangeText={(v) => setForm((x) => ({ ...x, name: v }))} /><Field label="รหัสแผนก" value={form.code} onChangeText={(v) => setForm((x) => ({ ...x, code: v }))} /><Field label="Manager Employee ID (ไม่บังคับ)" value={form.manager_employee_id} onChangeText={(v) => setForm((x) => ({ ...x, manager_employee_id: v }))} placeholder={managers.map((x) => x.employee_id).join(', ')} /><View style={styles.modalActions}><SmallButton title="ยกเลิก" onPress={onClose} /><SmallButton title="บันทึก" onPress={onSave} /></View></ScrollView></View></View></Modal>; }

const styles = StyleSheet.create({ note: { color: HrColors.muted, fontSize: HrFont.sm }, error: { padding: 12, borderRadius: HrRadius.md, backgroundColor: HrColors.redSoft }, errorText: { color: HrColors.red }, sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, heading: { color: HrColors.ink, fontSize: HrFont.md, fontWeight: '700', marginBottom: 10 }, row: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: HrColors.borderLight, paddingVertical: 10 }, leaveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: HrColors.borderLight, paddingVertical: 10 }, rowMain: { flex: 1 }, bold: { color: HrColors.ink, fontWeight: '600' }, muted: { color: HrColors.muted, fontSize: HrFont.xs, marginTop: 3 }, smallButton: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: HrRadius.sm, backgroundColor: HrColors.blue }, dangerButton: { backgroundColor: HrColors.red }, smallButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' }, overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }, modal: { maxHeight: '90%', backgroundColor: HrColors.surface, borderTopLeftRadius: HrRadius.xl, borderTopRightRadius: HrRadius.xl, padding: 20, gap: 10 }, modalTitle: { fontSize: HrFont.lg, fontWeight: '700', color: HrColors.ink, marginBottom: 10 }, label: { color: HrColors.muted, fontSize: HrFont.xs, marginTop: 8, marginBottom: 4 }, input: { borderWidth: 1, borderColor: HrColors.border, borderRadius: HrRadius.sm, paddingHorizontal: 10, paddingVertical: 9, color: HrColors.ink, backgroundColor: '#fff' }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 } });
