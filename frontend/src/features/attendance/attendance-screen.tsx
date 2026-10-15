import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HrScreen, SectionCard } from '@/components/hr/screen';
import { HrColors, HrFont, HrRadius, HrShadow } from '@/constants/hr-theme';
import { useAuth } from '@/context/auth-context';
import { hrApi } from '@/services/hr-api';

const DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const MONTH_NAMES = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

type AttendanceEntry = {
  date: string;
  checkIn: string;
  checkOut: string | null;
};

const SAMPLE_HISTORY: AttendanceEntry[] = [
  { date: '14 ต.ค. 2568', checkIn: '08:57', checkOut: '17:24' },
  { date: '13 ต.ค. 2568', checkIn: '09:03', checkOut: '17:31' },
  { date: '10 ต.ค. 2568', checkIn: '08:45', checkOut: '18:02' },
];

function useLiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function AttendanceScreen() {
  const { session } = useAuth();
  const liveClock = useLiveClock();

  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [history, setHistory] = useState<AttendanceEntry[]>(SAMPLE_HISTORY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const loadAttendance = useCallback(async (token: string) => {
    try {
      const records = await hrApi.getMyAttendance(token);
      if (records && records.length > 0) {
        const active = records.find((r) => !r.check_out_time);
        if (active) {
          setCheckedIn(true);
          const t = new Date(active.check_in_time);
          setCheckInTime(t.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
        } else {
          setCheckedIn(false);
          setCheckInTime(null);
        }

        const formatted: AttendanceEntry[] = records.map((r) => {
          const inDate = new Date(r.check_in_time);
          const dateStr = `${inDate.getDate()} ${MONTH_NAMES[inDate.getMonth()]} ${inDate.getFullYear() + 543}`;
          const inTime = inDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          const outTime = r.check_out_time
            ? new Date(r.check_out_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
            : null;
          return { date: dateStr, checkIn: inTime, checkOut: outTime };
        });
        setHistory(formatted);
      }
    } catch {
      // Fallback to sample history
    }
  }, []);

  useEffect(() => {
    if (session?.token) {
      loadAttendance(session.token);
    }
  }, [session?.token, loadAttendance]);

  useEffect(() => {
    if (!checkedIn) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [checkedIn]);

  const now = new Date();
  const todayLabel = `วัน${DAY_NAMES[now.getDay()]} ${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear() + 543}`;

  const handlePress = useCallback(async () => {
    setError(null);
    if (!session?.token) {
      setError('กรุณาเข้าสู่ระบบก่อนลงเวลา');
      return;
    }
    try {
      setLoading(true);
      if (!checkedIn) {
        await hrApi.checkIn(session.token);
        setCheckedIn(true);
        setCheckInTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
      } else {
        await hrApi.checkOut(session.token);
        setCheckedIn(false);
        setCheckInTime(null);
      }
      await loadAttendance(session.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง');
      // Fallback to local state so demo still works without backend
      if (!checkedIn) {
        setCheckedIn(true);
        setCheckInTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
      } else {
        setCheckedIn(false);
        setCheckInTime(null);
      }
    } finally {
      setLoading(false);
    }
  }, [checkedIn, session, loadAttendance]);

  return (
    <HrScreen title="เวลางาน" subtitle="ลงเวลาเข้าและออกงานของคุณ" headerVariant="hero">
      {/* Live clock hero */}
      <View style={styles.clockCard}>
        <Text style={styles.clockDate}>{todayLabel}</Text>
        <Text style={styles.clockTime}>{liveClock}</Text>
        <View style={[styles.statusPill, checkedIn ? styles.statusPillIn : styles.statusPillOut]}>
          <Animated.View
            style={[
              styles.statusDot,
              { backgroundColor: checkedIn ? HrColors.green : HrColors.muted },
              checkedIn && { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <Text style={[styles.statusLabel, { color: checkedIn ? HrColors.green : HrColors.muted }]}>
            {checkedIn ? 'กำลังทำงาน' : 'ยังไม่ได้ลงเวลาเข้า'}
          </Text>
        </View>

        {checkInTime && (
          <Text style={styles.checkInInfo}>เริ่มงาน {checkInTime} น.</Text>
        )}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handlePress}
          disabled={loading}
          style={({ pressed }) => [
            styles.clockButton,
            checkedIn ? styles.clockButtonOut : styles.clockButtonIn,
            (pressed || loading) && styles.clockButtonPressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={checkedIn ? HrColors.blue : '#fff'} />
          ) : (
            <>
              <Ionicons
                name={checkedIn ? 'log-out-outline' : 'log-in-outline'}
                size={20}
                color={checkedIn ? HrColors.blue : '#fff'}
              />
              <Text style={[styles.clockButtonText, checkedIn && styles.clockButtonTextOut]}>
                {checkedIn ? 'ลงเวลาออกงาน' : 'ลงเวลาเข้างาน'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* History */}
      <SectionCard>
        <Text style={styles.sectionTitle}>ประวัติล่าสุด</Text>
        {history.map((entry, i) => (
          <View key={`${entry.date}-${i}`}>
            <AttendanceRow entry={entry} />
            {i < history.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </SectionCard>

      <Text style={styles.note}>
        * ประวัติเป็นข้อมูลตัวอย่าง — จะโหลดจาก{' '}
        <Text style={styles.noteCode}>GET /api/attendance/me</Text> เมื่อ API พร้อม
      </Text>
    </HrScreen>
  );
}

function AttendanceRow({ entry }: { entry: AttendanceEntry }) {
  const worked =
    entry.checkOut
      ? (() => {
          const [hi, mi] = entry.checkIn.split(':').map(Number);
          const [ho, mo] = entry.checkOut.split(':').map(Number);
          const mins = (ho * 60 + mo) - (hi * 60 + mi);
          return `${Math.floor(mins / 60)}h ${mins % 60}m`;
        })()
      : null;

  return (
    <View style={styles.histRow}>
      <View style={styles.histLeft}>
        <Text style={styles.histDate}>{entry.date}</Text>
        <Text style={styles.histTime}>
          {entry.checkIn} น. — {entry.checkOut ? `${entry.checkOut} น.` : 'ยังทำงานอยู่'}
        </Text>
      </View>
      {worked && (
        <View style={styles.workedBadge}>
          <Text style={styles.workedText}>{worked}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clockCard: {
    backgroundColor: HrColors.surface,
    borderRadius: HrRadius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    ...HrShadow.md,
  },
  clockDate: { color: HrColors.muted, fontSize: HrFont.sm },
  clockTime: {
    color: HrColors.ink,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: HrRadius.full,
  },
  statusPillIn: { backgroundColor: HrColors.greenSoft },
  statusPillOut: { backgroundColor: HrColors.canvas },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: HrFont.sm, fontWeight: '600' },
  checkInInfo: { color: HrColors.blue, fontSize: HrFont.sm, fontWeight: '600' },
  errorBanner: {
    backgroundColor: HrColors.redSoft,
    borderRadius: HrRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: '100%',
  },
  errorText: { color: HrColors.red, fontSize: HrFont.sm, fontWeight: '600', textAlign: 'center' },
  clockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: HrRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    marginTop: 4,
    ...HrShadow.md,
  },
  clockButtonIn: { backgroundColor: HrColors.blue },
  clockButtonOut: {
    backgroundColor: HrColors.blueSoft,
    borderWidth: 1.5,
    borderColor: HrColors.blue,
    ...HrShadow.sm,
  },
  clockButtonPressed: { opacity: 0.76 },
  clockButtonText: { color: '#fff', fontWeight: '700', fontSize: HrFont.base },
  clockButtonTextOut: { color: HrColors.blue },

  sectionTitle: { color: HrColors.ink, fontSize: HrFont.md, fontWeight: '700', marginBottom: 14 },
  divider: { height: 1, backgroundColor: HrColors.borderLight, marginVertical: 10 },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  histLeft: { flex: 1 },
  histDate: { color: HrColors.ink, fontWeight: '600', fontSize: HrFont.sm },
  histTime: { color: HrColors.muted, fontSize: HrFont.xs, marginTop: 3 },
  workedBadge: {
    backgroundColor: HrColors.greenSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: HrRadius.full,
  },
  workedText: { color: HrColors.green, fontSize: HrFont.xs, fontWeight: '700' },

  note: { color: HrColors.muted, fontSize: HrFont.xs, textAlign: 'center', lineHeight: 18 },
  noteCode: { color: HrColors.blue, fontWeight: '600' },
});
