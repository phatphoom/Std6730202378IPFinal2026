import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { HrScreen, SectionCard } from '@/components/hr/screen';
import { HrColors, HrFont, HrRadius, HrShadow } from '@/constants/hr-theme';
import { useAuth } from '@/context/auth-context';
import { hrApi } from '@/services/hr-api';

const NOW = new Date();
const DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
const todayLabel = `วัน${DAY_NAMES[NOW.getDay()]}ที่ ${NOW.getDate()} ${MONTH_NAMES[NOW.getMonth()]} ${NOW.getFullYear() + 543}`;

type StatItem = {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tone: string;
  bg: string;
  route: string;
};

function StatCard({ item, index }: { item: StatItem; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: 100 + index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: 100 + index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={[styles.statCardWrapper, { opacity, transform: [{ translateY }] }]}>
      <Pressable
        style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
        onPress={() => router.push(item.route as never)}
      >
        <View style={[styles.statIconBg, { backgroundColor: item.bg }]}>
          <Ionicons name={item.icon} size={18} color={item.tone} />
        </View>
        <Text style={[styles.statValue, { color: item.tone }]}>{item.value}</Text>
        <Text style={styles.statLabel}>{item.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function DashboardScreen() {
  const { session } = useAuth();
  const greeting = session ? `สวัสดี, ${session.user.first_name}` : 'สวัสดี, ผู้จัดการ';
  const role = session?.user.role ?? 'manager';

  const [activeCount, setActiveCount] = useState('24');
  const [onLeaveCount, setOnLeaveCount] = useState('2');
  const [pendingCount, setPendingCount] = useState('3');

  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [headerOpacity]);

  useEffect(() => {
    if (!session?.token) return;

    // Load live team size and leave counts
    Promise.allSettled([
      hrApi.getEmployees(session.token),
      hrApi.getMyLeaveRequests(session.token),
    ]).then(([empResult, leaveResult]) => {
      if (empResult.status === 'fulfilled' && empResult.value?.length > 0) {
        setActiveCount(String(empResult.value.length));
      }
      if (leaveResult.status === 'fulfilled' && leaveResult.value?.length > 0) {
        const pending = leaveResult.value.filter((l) => l.status === 'pending').length;
        setPendingCount(String(pending));
        const approved = leaveResult.value.filter((l) => l.status === 'approved').length;
        setOnLeaveCount(String(approved));
      }
    });
  }, [session?.token]);

  const liveStats: StatItem[] = [
    {
      label: 'สมาชิกในทีม',
      value: activeCount,
      icon: 'people',
      tone: HrColors.blue,
      bg: HrColors.blueSoft,
      route: '/(tabs)/employees',
    },
    {
      label: 'ลางานอนุมัติแล้ว',
      value: onLeaveCount,
      icon: 'calendar',
      tone: HrColors.amber,
      bg: HrColors.amberSoft,
      route: '/(tabs)/leave',
    },
    {
      label: 'รออนุมัติ',
      value: pendingCount,
      icon: 'checkmark-circle',
      tone: HrColors.green,
      bg: HrColors.greenSoft,
      route: '/(tabs)/leave',
    },
  ];

  return (
    <HrScreen title={greeting} subtitle={todayLabel} headerVariant="hero">
      {/* Hero card */}
      <Animated.View style={{ opacity: headerOpacity }}>
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroEyebrow}>
              <Ionicons name="pulse" size={13} color={HrColors.blue} /> ภาพรวมทีม
            </Text>
            <Text style={styles.heroTitle}>พร้อมเริ่มวันทำงานแล้ว</Text>
            <Text style={styles.heroBody}>
              ตรวจสอบการลงเวลาและคำขอที่ต้องดำเนินการได้จากเมนูด้านล่าง
            </Text>
          </View>
          <View style={styles.roleChip}>
            <Text style={styles.roleChipText}>{role}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Stat cards */}
      <View style={styles.statRow}>
        {liveStats.map((item, i) => (
          <StatCard key={item.label} item={item} index={i} />
        ))}
      </View>

      {/* Action list */}
      <SectionCard>
        <Text style={styles.sectionTitle}>รายการที่ต้องติดตาม</Text>
        <ActionRow
          title={`คำขอลางาน ${pendingCount} รายการ`}
          detail="รอการตรวจสอบและตัดสินใจ"
          icon="calendar-outline"
          iconColor={HrColors.amber}
          onPress={() => router.push('/(tabs)/leave' as never)}
          linkLabel="ดูคำขอ"
        />
        <View style={styles.divider} />
        <ActionRow
          title="บันทึกเวลางานวันนี้"
          detail="ลงเวลาเข้างานหรือออกงาน"
          icon="time-outline"
          iconColor={HrColors.blue}
          onPress={() => router.push('/(tabs)/attendance' as never)}
          linkLabel="ไปที่เวลางาน"
        />
      </SectionCard>

      {/* Quick links */}
      <View style={styles.quickRow}>
        <QuickLink label="เวลางาน" icon="time" route="/(tabs)/attendance" color={HrColors.blue} />
        <QuickLink label="ยื่นลา" icon="add-circle" route="/(tabs)/leave" color={HrColors.green} />
        <QuickLink label="ทีมงาน" icon="people" route="/(tabs)/employees" color={HrColors.purple} />
        <QuickLink label="เงินเดือน" icon="analytics" route="/(tabs)/employees" color={HrColors.amber} />
      </View>

      <Text style={styles.note}>
        * สถิติอัปเดตอัตโนมัติจาก API เมื่อเข้าสู่ระบบ
      </Text>
    </HrScreen>
  );
}

function ActionRow({
  title,
  detail,
  icon,
  iconColor,
  onPress,
  linkLabel,
}: {
  title: string;
  detail: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  onPress: () => void;
  linkLabel: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: HrColors.canvas }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDetail}>{detail}</Text>
      </View>
      <Text style={[styles.link, { color: iconColor }]}>{linkLabel} →</Text>
    </Pressable>
  );
}

function QuickLink({
  label,
  icon,
  route,
  color,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: string;
  color: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickCard, pressed && styles.quickCardPressed]}
      onPress={() => router.push(route as never)}
    >
      <View style={[styles.quickIcon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: HrColors.surface,
    borderRadius: HrRadius.xl,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    ...HrShadow.md,
  },
  heroLeft: { flex: 1, gap: 6 },
  heroEyebrow: { color: HrColors.blue, fontSize: HrFont.xs, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: { color: HrColors.ink, fontSize: HrFont.lg, fontWeight: '700', letterSpacing: -0.3 },
  heroBody: { color: HrColors.muted, fontSize: HrFont.sm, lineHeight: 20 },
  roleChip: {
    backgroundColor: HrColors.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: HrRadius.full,
  },
  roleChipText: { color: HrColors.blue, fontSize: HrFont.xs, fontWeight: '700', textTransform: 'capitalize' },

  statRow: { flexDirection: 'row', gap: 10 },
  statCardWrapper: { flex: 1 },
  statCard: {
    backgroundColor: HrColors.surface,
    borderRadius: HrRadius.lg,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: HrColors.borderLight,
    ...HrShadow.sm,
  },
  statCardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  statIconBg: {
    width: 34,
    height: 34,
    borderRadius: HrRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: { fontSize: HrFont['2xl'], fontWeight: '800', letterSpacing: -1 },
  statLabel: { fontSize: HrFont.xs, color: HrColors.muted, lineHeight: 16 },

  sectionTitle: { color: HrColors.ink, fontSize: HrFont.md, fontWeight: '700', marginBottom: 16 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
    borderRadius: HrRadius.md,
  },
  actionRowPressed: { opacity: 0.75 },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: HrRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { flex: 1 },
  actionTitle: { color: HrColors.ink, fontSize: HrFont.sm, fontWeight: '600' },
  actionDetail: { color: HrColors.muted, fontSize: HrFont.xs, marginTop: 2 },
  link: { fontSize: HrFont.sm, fontWeight: '700' },
  divider: { height: 1, backgroundColor: HrColors.borderLight, marginVertical: 14 },

  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1,
    backgroundColor: HrColors.surface,
    borderRadius: HrRadius.lg,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: HrColors.borderLight,
    ...HrShadow.sm,
  },
  quickCardPressed: { opacity: 0.8 },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: HrRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: { fontSize: HrFont.xs, fontWeight: '700' },

  note: { color: HrColors.muted, fontSize: HrFont.xs, textAlign: 'center', lineHeight: 18 },
});
