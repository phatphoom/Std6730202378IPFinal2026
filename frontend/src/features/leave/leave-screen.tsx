import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
import type { LeaveRequest } from '@/types/hr';

const LEAVE_TYPES = ['ลาพักร้อน', 'ลาป่วย', 'ลากิจ', 'ลาคลอด'] as const;
type LeaveType = (typeof LEAVE_TYPES)[number];

const SAMPLE: LeaveRequest[] = [
  {
    leave_id: 'LEA-0003',
    leave_type: 'ลาพักร้อน',
    start_date: '2026-10-20',
    end_date: '2026-10-21',
    reason: 'Personal leave — family trip',
    status: 'pending',
  },
  {
    leave_id: 'LEA-0002',
    leave_type: 'ลาป่วย',
    start_date: '2026-10-08',
    end_date: '2026-10-08',
    reason: 'Medical appointment',
    status: 'approved',
  },
];

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

type FormState = {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
};

const DEFAULT_FORM: FormState = {
  leaveType: 'ลาพักร้อน',
  startDate: '',
  endDate: '',
  reason: '',
};

export function LeaveScreen() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>(SAMPLE);
  const [loadingList, setLoadingList] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load real data when session available
  useEffect(() => {
    if (!session?.token) return;
    setLoadingList(true);
    hrApi
      .getMyLeaveRequests(session.token)
      .then((data) => {
        if (data && data.length > 0) setRequests(data);
      })
      .catch(() => {
        // Keep sample data on error
      })
      .finally(() => setLoadingList(false));
  }, [session?.token]);

  const validateForm = (): string | null => {
    if (!form.startDate.match(/^\d{4}-\d{2}-\d{2}$/))
      return 'รูปแบบวันที่ต้องเป็น ปปปป-ดด-วว เช่น 2026-10-20';
    if (!form.endDate.match(/^\d{4}-\d{2}-\d{2}$/))
      return 'รูปแบบวันที่สิ้นสุดต้องเป็น ปปปป-ดด-วว';
    if (form.endDate < form.startDate) return 'วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่ม';
    if (!form.reason.trim()) return 'กรุณาระบุเหตุผลการลา';
    return null;
  };

  const handleSubmit = useCallback(async () => {
    const err = validateForm();
    if (err) { setFormError(err); return; }
    setFormError(null);
    try {
      setSubmitting(true);
      const payload = {
        leave_type: form.leaveType,
        start_date: form.startDate,
        end_date: form.endDate,
        reason: form.reason.trim(),
      };
      if (session?.token) {
        const created = await hrApi.createLeaveRequest(session.token, payload);
        setRequests((prev) => [created, ...prev]);
      } else {
        // Offline demo
        const demo: LeaveRequest = {
          leave_id: `LEA-${String(requests.length + 1).padStart(4, '0')}`,
          status: 'pending',
          ...payload,
        };
        setRequests((prev) => [demo, ...prev]);
      }
      setForm(DEFAULT_FORM);
      setShowForm(false);
    } catch {
      // Offline demo fallback
      const demo: LeaveRequest = {
        leave_id: `LEA-${String(requests.length + 1).padStart(4, '0')}`,
        leave_type: form.leaveType,
        start_date: form.startDate,
        end_date: form.endDate,
        reason: form.reason.trim(),
        status: 'pending',
      };
      setRequests((prev) => [demo, ...prev]);
      setForm(DEFAULT_FORM);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }, [form, session, requests]);

  return (
    <HrScreen
      title="คำขอลางาน"
      subtitle="ติดตามและส่งคำขอลาของคุณ"
      headerVariant="hero"
      action={
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          onPress={() => { setForm(DEFAULT_FORM); setFormError(null); setShowForm(true); }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addText}>ยื่นคำขอ</Text>
        </Pressable>
      }
    >
      {/* Leave balance */}
      <SectionCard variant="accent">
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>วันลาคงเหลือ</Text>
            <Text style={styles.balanceValue}>
              8 <Text style={styles.balanceUnit}>วัน</Text>
            </Text>
          </View>
          <View style={styles.balanceMeta}>
            <BalanceItem label="พักร้อน" value="6" color={HrColors.blue} />
            <BalanceItem label="ลาป่วย" value="2" color={HrColors.amber} />
          </View>
        </View>
      </SectionCard>

      {/* List */}
      {loadingList ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={HrColors.blue} />
          <Text style={styles.loadingText}>กำลังโหลดคำขอ…</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {requests.map((req) => (
            <SectionCard key={req.leave_id}>
              <View style={styles.reqHeader}>
                <View style={styles.reqLeft}>
                  <View style={styles.reqTypeRow}>
                    <Ionicons name="calendar-outline" size={14} color={HrColors.blue} />
                    <Text style={styles.reqType}>{req.leave_type}</Text>
                  </View>
                  <Text style={styles.reqDate}>
                    {formatDate(req.start_date)} – {formatDate(req.end_date)}
                  </Text>
                </View>
                <StatusBadge status={req.status} />
              </View>
              <Text style={styles.reason}>{req.reason}</Text>
              <Text style={styles.reqId}>{req.leave_id}</Text>
            </SectionCard>
          ))}
        </View>
      )}

      {/* Form Modal */}
      <Modal
        visible={showForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.modalLayer}>
          <View style={styles.modal}>
            {/* Handle */}
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>ยื่นคำขอลางาน</Text>

              {formError ? (
                <View style={styles.formError}>
                  <Text style={styles.formErrorText}>⚠ {formError}</Text>
                </View>
              ) : null}

              {/* Leave type */}
              <FormLabel>ประเภทการลา</FormLabel>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeScroll}
              >
                {LEAVE_TYPES.map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.typeChip, form.leaveType === t && styles.typeChipActive]}
                    onPress={() => setForm((f) => ({ ...f, leaveType: t }))}
                  >
                    <Text
                      style={[styles.typeChipText, form.leaveType === t && styles.typeChipTextActive]}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Start date */}
              <FormLabel>วันที่เริ่ม (ปปปป-ดด-วว)</FormLabel>
              <TextInput
                value={form.startDate}
                onChangeText={(v) => setForm((f) => ({ ...f, startDate: v }))}
                placeholder="2026-10-20"
                placeholderTextColor={HrColors.mutedLight}
                style={styles.input}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
              />

              {/* End date */}
              <FormLabel>วันที่สิ้นสุด (ปปปป-ดด-วว)</FormLabel>
              <TextInput
                value={form.endDate}
                onChangeText={(v) => setForm((f) => ({ ...f, endDate: v }))}
                placeholder="2026-10-21"
                placeholderTextColor={HrColors.mutedLight}
                style={styles.input}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
              />

              {/* Reason */}
              <FormLabel>เหตุผลการลา</FormLabel>
              <TextInput
                value={form.reason}
                onChangeText={(v) => setForm((f) => ({ ...f, reason: v }))}
                placeholder="ระบุเหตุผลการลา…"
                placeholderTextColor={HrColors.mutedLight}
                style={[styles.input, styles.inputMultiline]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Actions */}
              <View style={styles.modalActions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => setShowForm(false)}
                >
                  <Text style={styles.cancelText}>ยกเลิก</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.8 }, submitting && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitText}>ส่งคำขอ</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </HrScreen>
  );
}

function FormLabel({ children }: { children: string }) {
  return <Text style={styles.formLabel}>{children}</Text>;
}

function BalanceItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.balanceItem}>
      <Text style={[styles.balanceItemValue, { color }]}>{value}</Text>
      <Text style={styles.balanceItemLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: HrColors.blueLight,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: HrRadius.md,
    ...HrShadow.sm,
  },
  addButtonPressed: { opacity: 0.8 },
  addText: { color: '#fff', fontSize: HrFont.sm, fontWeight: '700' },

  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: HrColors.blue, fontSize: HrFont.sm, fontWeight: '600' },
  balanceValue: { color: HrColors.ink, fontSize: HrFont['3xl'], fontWeight: '800', letterSpacing: -1, marginTop: 4 },
  balanceUnit: { color: HrColors.muted, fontSize: HrFont.md, fontWeight: '500' },
  balanceMeta: { flexDirection: 'row', gap: 14 },
  balanceItem: { alignItems: 'center' },
  balanceItemValue: { fontSize: HrFont.xl, fontWeight: '700' },
  balanceItemLabel: { color: HrColors.muted, fontSize: HrFont.xs, marginTop: 2 },

  loadingBox: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  loadingText: { color: HrColors.muted, fontSize: HrFont.sm },

  list: { gap: 10 },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  reqLeft: { flex: 1, gap: 4 },
  reqTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reqType: { color: HrColors.ink, fontSize: HrFont.base, fontWeight: '700' },
  reqDate: { color: HrColors.muted, fontSize: HrFont.xs },
  reason: { color: HrColors.muted, fontSize: HrFont.sm, marginTop: 10, lineHeight: 20 },
  reqId: { color: HrColors.mutedLight, fontSize: HrFont.xs, marginTop: 6, fontWeight: '600' },

  modalLayer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 30, 46, 0.48)',
  },
  modal: {
    backgroundColor: HrColors.surface,
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: HrRadius.xl,
    borderTopRightRadius: HrRadius.xl,
    gap: 4,
    maxHeight: '90%',
    ...HrShadow.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: HrColors.border,
    borderRadius: HrRadius.full,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { color: HrColors.ink, fontSize: HrFont.xl, fontWeight: '700', marginBottom: 12 },
  formError: {
    backgroundColor: HrColors.redSoft,
    borderRadius: HrRadius.md,
    padding: 12,
    marginBottom: 8,
  },
  formErrorText: { color: HrColors.red, fontSize: HrFont.sm, fontWeight: '600' },
  formLabel: {
    color: HrColors.ink,
    fontSize: HrFont.sm,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  typeScroll: { marginBottom: 4 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: HrRadius.full,
    backgroundColor: HrColors.canvas,
    marginRight: 8,
    borderWidth: 1,
    borderColor: HrColors.border,
  },
  typeChipActive: {
    backgroundColor: HrColors.blueSoft,
    borderColor: HrColors.blue,
  },
  typeChipText: { color: HrColors.muted, fontSize: HrFont.sm, fontWeight: '600' },
  typeChipTextActive: { color: HrColors.blue },
  input: {
    backgroundColor: HrColors.canvas,
    borderWidth: 1.5,
    borderColor: HrColors.border,
    borderRadius: HrRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: HrColors.ink,
    fontSize: HrFont.base,
    marginBottom: 4,
  },
  inputMultiline: { minHeight: 88, paddingTop: 12 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: HrRadius.md },
  cancelText: { color: HrColors.muted, fontWeight: '700', fontSize: HrFont.sm },
  submitBtn: {
    backgroundColor: HrColors.blue,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: HrRadius.md,
    ...HrShadow.sm,
    minWidth: 90,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: HrFont.sm },
});
