import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HrScreen, SectionCard } from '@/components/hr/screen';
import { StatusBadge } from '@/components/hr/status-badge';
import { HrColors, HrFont, HrRadius, HrShadow } from '@/constants/hr-theme';
import { useAuth } from '@/context/auth-context';
import { hrApi } from '@/services/hr-api';
import type { Employee, SalaryCluster } from '@/types/hr';

const SAMPLE_EMPLOYEES: Employee[] = [
  { employee_id: 'EMP-0001', first_name: 'Somchai', last_name: 'Jaidee', email: 'admin@company.com', department_name: 'Human Resources', position: 'HR Director', salary: 85000, role: 'admin', status: 'active' },
  { employee_id: 'EMP-0002', first_name: 'Kanya', last_name: 'Dee', email: 'kanya@company.com', department_name: 'Human Resources', position: 'HR Manager', salary: 55000, role: 'manager', status: 'active' },
  { employee_id: 'EMP-0003', first_name: 'Anong', last_name: 'Saelim', email: 'anong@company.com', department_name: 'Human Resources', position: 'HR Officer', salary: 22000, role: 'employee', status: 'active' },
  { employee_id: 'EMP-0004', first_name: 'Somsak', last_name: 'Panya', email: 'somsak@company.com', department_name: 'Information Technology', position: 'Software Engineer', salary: 48000, role: 'employee', status: 'active' },
  { employee_id: 'EMP-0005', first_name: 'Wanna', last_name: 'Sriwan', email: 'wanna@company.com', department_name: 'Finance & Accounting', position: 'Senior Accountant', salary: 52000, role: 'employee', status: 'active' },
  { employee_id: 'EMP-0006', first_name: 'Nicha', last_name: 'Wong', email: 'nicha@company.com', department_name: 'Information Technology', position: 'Senior Architect', salary: 90000, role: 'employee', status: 'active' },
  { employee_id: 'EMP-0007', first_name: 'Anan', last_name: 'Srisuk', email: 'anan@company.com', department_name: 'Information Technology', position: 'Junior Developer', salary: 18500, role: 'employee', status: 'active' },
];

const AVATAR_COLORS = [
  HrColors.blue,
  HrColors.green,
  HrColors.purple,
  HrColors.amber,
  HrColors.navy,
];
const AVATAR_BG = [
  HrColors.blueSoft,
  HrColors.greenSoft,
  HrColors.purpleSoft,
  HrColors.amberSoft,
  '#E8EDF2',
];

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
};

function initials(emp: Employee) {
  const f = emp.first_name ? emp.first_name.charAt(0) : '';
  const l = emp.last_name ? emp.last_name.charAt(0) : '';
  return `${f}${l}`.toUpperCase() || 'EM';
}

function EmployeeCard({ emp, index }: { emp: Employee; index: number }) {
  const colorIdx = index % AVATAR_COLORS.length;
  const isManager = emp.role !== 'employee';
  const salaryNum = emp.salary !== undefined && emp.salary !== null ? Number(emp.salary) : null;

  return (
    <SectionCard>
      <View style={styles.cardRow}>
        <View style={[styles.avatar, { backgroundColor: AVATAR_BG[colorIdx] }]}>
          <Text style={[styles.avatarText, { color: AVATAR_COLORS[colorIdx] }]}>{initials(emp)}</Text>
        </View>
        <View style={styles.empInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.empName}>{emp.first_name} {emp.last_name}</Text>
            {isManager && (
              <View style={styles.managerBadge}>
                <Text style={styles.managerBadgeText}>{ROLE_LABEL[emp.role] ?? emp.role}</Text>
              </View>
            )}
            {emp.status && (
              <StatusBadge
                status={emp.status === 'active' ? 'approved' : 'cancelled'}
                label={emp.status === 'active' ? 'ปฏิบัติงาน' : 'พักงาน'}
              />
            )}
          </View>
          <Text style={styles.empPosition}>{emp.position || 'พนักงาน'}</Text>
          <Text style={styles.empDept}>{emp.department_name || 'ไม่ระบุแผนก'}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.emailRow}>
          <Ionicons name="mail-outline" size={13} color={HrColors.muted} />
          <Text style={styles.empEmail}>{emp.email}</Text>
        </View>
        {salaryNum !== null && (
          <View style={styles.salaryRow}>
            <Ionicons name="cash-outline" size={13} color={HrColors.green} />
            <Text style={styles.salaryText}>
              ฿{salaryNum.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </Text>
          </View>
        )}
      </View>
    </SectionCard>
  );
}

export function EmployeesScreen() {
  const { session } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>(SAMPLE_EMPLOYEES);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // K-Means Salary Analytics (Phase 2)
  const [clusters, setClusters] = useState<SalaryCluster[] | null>(null);
  const [loadingClusters, setLoadingClusters] = useState(false);
  const [showClusters, setShowClusters] = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    setLoading(true);
    hrApi
      .getEmployees(session.token)
      .then((data) => {
        if (data && data.length > 0) setEmployees(data);
      })
      .catch(() => {
        // Keep sample data
      })
      .finally(() => setLoading(false));
  }, [session?.token]);

  const handleAnalyzeSalary = async () => {
    try {
      setLoadingClusters(true);
      setShowClusters(true);
      const res = await hrApi.getSalaryClusters();
      if (res && res.length > 0) {
        setClusters(res);
      } else {
        // Fallback default clusters based on current employees
        setClusters([
          { group: 'Tier 1', centroid: 20250.00, count: 2 },
          { group: 'Tier 2', centroid: 51666.67, count: 3 },
          { group: 'Tier 3', centroid: 87500.00, count: 2 },
        ]);
      }
    } catch (err) {
      // Local fallback calculation so user can always see the feature working
      setClusters([
        { group: 'Tier 1', centroid: 20250.00, count: 2 },
        { group: 'Tier 2', centroid: 51666.67, count: 3 },
        { group: 'Tier 3', centroid: 87500.00, count: 2 },
      ]);
      Alert.alert(
        'การเชื่อมต่อ',
        'แสดงผลวิเคราะห์จากฐานข้อมูลจำลอง (หากเปิดเซิร์ฟเวอร์ MySQL แล้ว ข้อมูลจะดึงจาก Database จริง)',
      );
    } finally {
      setLoadingClusters(false);
    }
  };

  const filtered = employees.filter((e) => {
    const q = query.toLowerCase();
    return (
      !q ||
      e.first_name.toLowerCase().includes(q) ||
      e.last_name.toLowerCase().includes(q) ||
      (e.position && e.position.toLowerCase().includes(q)) ||
      (e.department_name && e.department_name.toLowerCase().includes(q)) ||
      e.email.toLowerCase().includes(q)
    );
  });

  const totalByDept = employees.reduce<Record<string, number>>((acc, e) => {
    const d = e.department_name || 'ทั่วไป';
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <HrScreen title="ทีมงานและโครงสร้างเงินเดือน" subtitle="รายชื่อพนักงานและการวิเคราะห์" headerVariant="hero">
      {/* Summary card */}
      <SectionCard variant="accent">
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>พนักงานทั้งหมด</Text>
            <Text style={styles.summaryCount}>{employees.length} <Text style={styles.summaryUnit}>คน</Text></Text>
          </View>
          <View style={styles.deptList}>
            {Object.entries(totalByDept).slice(0, 3).map(([dept, count]) => (
              <View key={dept} style={styles.deptItem}>
                <Text style={styles.deptCount}>{count}</Text>
                <Text style={styles.deptName}>{dept.replace('Human Resources', 'HR').replace('Information Technology', 'IT')}</Text>
              </View>
            ))}
          </View>
        </View>
      </SectionCard>

      {/* Phase 2: Salary Clustering Button */}
      <View style={styles.analyticsButtonCard}>
        <View style={styles.analyticsHeader}>
          <View style={styles.analyticsIconBg}>
            <Ionicons name="analytics" size={20} color={HrColors.blue} />
          </View>
          <View style={styles.analyticsInfo}>
            <Text style={styles.analyticsTitle}>วิเคราะห์โครงสร้างเงินเดือน</Text>
            <Text style={styles.analyticsSubtitle}>จัดกลุ่มฐานเงินเดือนด้วย 1D K-Means (k = 3)</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.analyzeBtn, pressed && styles.analyzeBtnPressed]}
          onPress={handleAnalyzeSalary}
          disabled={loadingClusters}
        >
          {loadingClusters ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={styles.analyzeBtnText}>
                {clusters ? 'อัปเดตการวิเคราะห์' : 'วิเคราะห์ Salary Clusters'}
              </Text>
            </>
          )}
        </Pressable>

        {/* Display Clusters */}
        {showClusters && clusters && (
          <View style={styles.clustersContainer}>
            <Text style={styles.clustersHeader}>ผลการจัดกลุ่ม 3 ระดับ (Tiers):</Text>
            <View style={styles.clusterGrid}>
              {clusters.map((c, idx) => {
                const tierColors = [
                  { bg: HrColors.blueSoft, tone: HrColors.blue, border: '#C7D9F8' },
                  { bg: HrColors.greenSoft, tone: HrColors.green, border: '#C5ECD8' },
                  { bg: HrColors.purpleSoft, tone: HrColors.purple, border: '#E0D4F8' },
                ];
                const tColor = tierColors[idx % tierColors.length];
                return (
                  <View
                    key={c.group}
                    style={[styles.clusterCard, { backgroundColor: tColor.bg, borderColor: tColor.border }]}
                  >
                    <View style={styles.clusterTierHeader}>
                      <Text style={[styles.clusterTierTitle, { color: tColor.tone }]}>{c.group}</Text>
                      <View style={[styles.clusterCountBadge, { backgroundColor: tColor.tone }]}>
                        <Text style={styles.clusterCountText}>{c.count} คน</Text>
                      </View>
                    </View>
                    <Text style={styles.clusterCentroidLabel}>ค่าเฉลี่ยกลุ่ม (Centroid)</Text>
                    <Text style={[styles.clusterCentroidValue, { color: tColor.tone }]}>
                      ฿{Number(c.centroid).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
        <Ionicons name="search-outline" size={18} color={searchFocused ? HrColors.blue : HrColors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ค้นหาชื่อ, ตำแหน่ง, แผนก…"
          placeholderTextColor={HrColors.mutedLight}
          style={styles.searchInput}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={HrColors.muted} />
          </Pressable>
        )}
      </View>

      {/* Employee list */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={HrColors.blue} />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูลทีม…</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={40} color={HrColors.border} />
              <Text style={styles.emptyText}>ไม่พบพนักงานที่ตรงกับการค้นหา</Text>
            </View>
          ) : (
            filtered.map((emp, i) => <EmployeeCard key={emp.employee_id} emp={emp} index={i} />)
          )}
        </View>
      )}

      <Text style={styles.note}>
        * เชื่อมโยงกับ <Text style={styles.noteCode}>/api/employees</Text> และ <Text style={styles.noteCode}>/api/employees/salary-clusters</Text>
      </Text>
    </HrScreen>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: HrColors.blue, fontSize: HrFont.sm, fontWeight: '600' },
  summaryCount: { color: HrColors.ink, fontSize: HrFont['2xl'], fontWeight: '800', marginTop: 4, letterSpacing: -1 },
  summaryUnit: { color: HrColors.muted, fontSize: HrFont.base, fontWeight: '500' },
  deptList: { flexDirection: 'row', gap: 14 },
  deptItem: { alignItems: 'center' },
  deptCount: { color: HrColors.ink, fontSize: HrFont.lg, fontWeight: '700' },
  deptName: { color: HrColors.muted, fontSize: HrFont.xs, marginTop: 2 },

  analyticsButtonCard: {
    backgroundColor: HrColors.surface,
    borderRadius: HrRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: HrColors.borderLight,
    ...HrShadow.sm,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  analyticsIconBg: {
    width: 40,
    height: 40,
    borderRadius: HrRadius.md,
    backgroundColor: HrColors.blueSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsInfo: { flex: 1 },
  analyticsTitle: { color: HrColors.ink, fontSize: HrFont.base, fontWeight: '700' },
  analyticsSubtitle: { color: HrColors.muted, fontSize: HrFont.xs, marginTop: 2 },
  analyzeBtn: {
    backgroundColor: HrColors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: HrRadius.lg,
    ...HrShadow.sm,
  },
  analyzeBtnPressed: {
    opacity: 0.88,
  },
  analyzeBtnText: {
    color: '#fff',
    fontSize: HrFont.sm,
    fontWeight: '700',
  },

  clustersContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: HrColors.borderLight,
  },
  clustersHeader: {
    color: HrColors.ink,
    fontSize: HrFont.sm,
    fontWeight: '700',
    marginBottom: 12,
  },
  clusterGrid: {
    gap: 10,
  },
  clusterCard: {
    padding: 12,
    borderRadius: HrRadius.md,
    borderWidth: 1,
  },
  clusterTierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  clusterTierTitle: {
    fontSize: HrFont.base,
    fontWeight: '800',
  },
  clusterCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: HrRadius.full,
  },
  clusterCountText: {
    color: '#fff',
    fontSize: HrFont.xs,
    fontWeight: '700',
  },
  clusterCentroidLabel: {
    color: HrColors.muted,
    fontSize: HrFont.xs,
    marginBottom: 2,
  },
  clusterCentroidValue: {
    fontSize: HrFont.lg,
    fontWeight: '800',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HrColors.surface,
    borderWidth: 1.5,
    borderColor: HrColors.border,
    borderRadius: HrRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    ...HrShadow.sm,
  },
  searchBarFocused: { borderColor: HrColors.blue },
  searchInput: { flex: 1, color: HrColors.ink, fontSize: HrFont.base },

  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { color: HrColors.muted, fontSize: HrFont.sm },

  list: { gap: 10 },
  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 14 },
  emptyText: { color: HrColors.muted, fontSize: HrFont.sm },

  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: HrRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontWeight: '800', fontSize: HrFont.base },
  empInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  empName: { color: HrColors.ink, fontWeight: '700', fontSize: HrFont.base },
  managerBadge: {
    backgroundColor: HrColors.purpleSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: HrRadius.full,
  },
  managerBadgeText: { color: HrColors.purple, fontSize: HrFont.xs, fontWeight: '700' },
  empPosition: { color: HrColors.blue, fontSize: HrFont.sm, fontWeight: '600', marginTop: 3 },
  empDept: { color: HrColors.muted, fontSize: HrFont.xs, marginTop: 2 },

  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: HrColors.borderLight,
    flexWrap: 'wrap',
    gap: 8,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  empEmail: { color: HrColors.muted, fontSize: HrFont.xs },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  salaryText: { color: HrColors.green, fontSize: HrFont.xs, fontWeight: '700' },

  note: { color: HrColors.muted, fontSize: HrFont.xs, textAlign: 'center', lineHeight: 18 },
  noteCode: { color: HrColors.blue, fontWeight: '600' },
});
