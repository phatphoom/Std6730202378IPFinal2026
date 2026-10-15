import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { HrScreen, SectionCard } from '@/components/hr/screen';
import { HrColors, HrFont, HrRadius, HrShadow } from '@/constants/hr-theme';
import { useAuth } from '@/context/auth-context';

type FieldItemProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

function FieldItem({ icon, label, value }: FieldItemProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldIcon}>
        <Ionicons name={icon} size={16} color={HrColors.blue} />
      </View>
      <View style={styles.fieldText}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

type SettingRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  danger?: boolean;
};

function SettingRow({ icon, label, onPress, danger }: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
      onPress={onPress}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <Ionicons name={icon} size={16} color={danger ? HrColors.red : HrColors.muted} />
      </View>
      <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color={HrColors.muted} />}
    </Pressable>
  );
}

const AVATAR_COLORS = [
  HrColors.blue,
  HrColors.green,
  HrColors.purple,
  HrColors.amber,
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ',
  manager: 'ผู้จัดการ',
  employee: 'พนักงาน',
};

export function ProfileScreen() {
  const { session, signOut } = useAuth();

  const name = session ? `${session.user.first_name} ${session.user.last_name}` : 'ผู้ใช้งานตัวอย่าง';
  const email = session?.user.email ?? 'employee@company.com';
  const dept = session?.user.department_name ?? 'Human Resources';
  const position = session?.user.position ?? 'HR Manager';
  const role = session?.user.role ?? 'manager';
  const phone = session?.user.phone ?? '081-234-5678';
  const salary = session?.user.salary
    ? `฿${Number(session.user.salary).toLocaleString('th-TH')}`
    : '฿85,000';
  const initials = name
    .split(' ')
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const avatarColor = getAvatarColor(name);

  const handleSignOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <HrScreen title="โปรไฟล์" subtitle="ข้อมูลบัญชีและการตั้งค่า" headerVariant="hero">
      {/* Avatar + name */}
      <View style={styles.profileHero}>
        <View style={[styles.avatarLg, { backgroundColor: avatarColor + '22' }]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profilePosition}>{position}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={12} color={HrColors.blue} />
          <Text style={styles.roleBadgeText}>{ROLE_LABEL[role] ?? role}</Text>
        </View>
        {!session && (
          <Pressable
            style={styles.loginBtn}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginBtnText}>เข้าสู่ระบบเพื่อดูข้อมูลจริง →</Text>
          </Pressable>
        )}
      </View>

      {/* Info */}
      <SectionCard>
        <Text style={styles.sectionTitle}>ข้อมูลบัญชี</Text>
        <View style={styles.fieldList}>
          <FieldItem icon="mail-outline" label="อีเมล" value={email} />
          <View style={styles.divider} />
          <FieldItem icon="call-outline" label="เบอร์โทรศัพท์" value={phone} />
          <View style={styles.divider} />
          <FieldItem icon="business-outline" label="แผนก" value={dept} />
          <View style={styles.divider} />
          <FieldItem icon="briefcase-outline" label="ตำแหน่ง" value={position} />
          <View style={styles.divider} />
          <FieldItem icon="cash-outline" label="ฐานเงินเดือน" value={salary} />
          <View style={styles.divider} />
          <FieldItem icon="shield-outline" label="บทบาท" value={ROLE_LABEL[role] ?? role} />
        </View>
      </SectionCard>

      {/* Settings */}
      <SectionCard>
        <Text style={styles.sectionTitle}>การตั้งค่าบัญชี</Text>
        <SettingRow icon="lock-closed-outline" label="เปลี่ยนรหัสผ่าน" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingRow icon="notifications-outline" label="การแจ้งเตือน" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingRow icon="document-text-outline" label="นโยบายความเป็นส่วนตัว" onPress={() => {}} />
      </SectionCard>

      {/* Sign out */}
      {session && (
        <SectionCard>
          <SettingRow icon="log-out-outline" label="ออกจากระบบ" onPress={handleSignOut} danger />
        </SectionCard>
      )}

      {/* App info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>HR Space · เวอร์ชัน 1.0.0</Text>
        <Text style={styles.appInfoText}>© 2026 HR Management System</Text>
      </View>
    </HrScreen>
  );
}

const styles = StyleSheet.create({
  profileHero: {
    backgroundColor: HrColors.surface,
    borderRadius: HrRadius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    ...HrShadow.md,
  },
  avatarLg: {
    width: 80,
    height: 80,
    borderRadius: HrRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarText: { fontSize: HrFont.xl, fontWeight: '800' },
  profileName: { color: HrColors.ink, fontSize: HrFont.lg, fontWeight: '700', letterSpacing: -0.3 },
  profilePosition: { color: HrColors.muted, fontSize: HrFont.sm },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: HrColors.blueSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: HrRadius.full,
    marginTop: 4,
  },
  roleBadgeText: { color: HrColors.blue, fontSize: HrFont.xs, fontWeight: '700' },
  loginBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: HrColors.blue,
    borderRadius: HrRadius.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  loginBtnText: { color: HrColors.blue, fontWeight: '700', fontSize: HrFont.sm },

  sectionTitle: { color: HrColors.ink, fontSize: HrFont.md, fontWeight: '700', marginBottom: 16 },
  fieldList: { gap: 0 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  fieldIcon: {
    width: 34,
    height: 34,
    borderRadius: HrRadius.md,
    backgroundColor: HrColors.blueSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldText: { flex: 1 },
  fieldLabel: { color: HrColors.muted, fontSize: HrFont.xs },
  fieldValue: { color: HrColors.ink, fontSize: HrFont.sm, fontWeight: '600', marginTop: 2 },
  divider: { height: 1, backgroundColor: HrColors.borderLight },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderRadius: HrRadius.md,
  },
  settingRowPressed: { backgroundColor: HrColors.canvas },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: HrRadius.md,
    backgroundColor: HrColors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIconDanger: { backgroundColor: HrColors.redSoft },
  settingLabel: { flex: 1, color: HrColors.ink, fontWeight: '600', fontSize: HrFont.sm },
  settingLabelDanger: { color: HrColors.red },

  appInfo: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  appInfoText: { color: HrColors.mutedLight, fontSize: HrFont.xs },
});
