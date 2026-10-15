import { StyleSheet, Text, View } from 'react-native';

import { HrColors } from '@/constants/hr-theme';
import type { LeaveStatus } from '@/types/hr';

const labels: Record<LeaveStatus, string> = {
  pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ', cancelled: 'ยกเลิกแล้ว',
};
const colors: Record<LeaveStatus, { bg: string; text: string }> = {
  pending: { bg: HrColors.amberSoft, text: HrColors.amber },
  approved: { bg: HrColors.greenSoft, text: HrColors.green },
  rejected: { bg: HrColors.redSoft, text: HrColors.red },
  cancelled: { bg: HrColors.canvas, text: HrColors.muted },
};

export function StatusBadge({ status }: { status: LeaveStatus }) {
  const color = colors[status];
  return <View style={[styles.badge, { backgroundColor: color.bg }]}><Text style={[styles.text, { color: color.text }]}>{labels[status]}</Text></View>;
}

const styles = StyleSheet.create({ badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 }, text: { fontSize: 12, fontWeight: '600' } });
