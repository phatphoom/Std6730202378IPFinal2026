import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { HrColors, HrFont, HrRadius, HrShadow } from '@/constants/hr-theme';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 560, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 560, useNativeDriver: true }),
    ]).start();
  }, []);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setError(null);
    try {
      setLoading(true);
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ โปรดลองอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Background panels */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <KeyboardAvoidingView
        style={styles.kvContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand mark */}
          <Animated.View style={[styles.brandSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.logoContainer}>
              <View style={styles.logoInner}>
                <Text style={styles.logoText}>HR</Text>
              </View>
            </View>
            <Text style={styles.brand}>HR SPACE</Text>
            <Text style={styles.tagline}>ระบบบริหารทรัพยากรบุคคล</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.cardTitle}>เข้าสู่ระบบ</Text>
            <Text style={styles.cardSubtitle}>
              ใช้อีเมลและรหัสผ่านของพนักงานเพื่อเข้าถึงข้อมูลที่ได้รับอนุญาต
            </Text>

            {/* Error banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>อีเมล</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                placeholder="you@company.com"
                placeholderTextColor={HrColors.mutedLight}
                style={[styles.input, emailFocused && styles.inputFocused]}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>รหัสผ่าน</Text>
              <TextInput
                secureTextEntry
                value={password}
                onChangeText={(v) => { setPassword(v); setError(null); }}
                placeholder="••••••••"
                placeholderTextColor={HrColors.mutedLight}
                style={[styles.input, passFocused && styles.inputFocused]}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
                onSubmitEditing={submit}
                returnKeyType="go"
              />
            </View>

            {/* Submit */}
            <Pressable
              disabled={loading}
              onPress={submit}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonLoading]}
            >
              <Text style={styles.buttonText}>{loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</Text>
            </Pressable>

            {/* Quick Fill Credentials */}
            <View style={styles.quickFillContainer}>
              <Text style={styles.quickFillLabel}>บัญชีทดสอบ (รหัส: password123):</Text>
              <View style={styles.quickFillRow}>
                <Pressable
                  style={styles.quickChip}
                  onPress={() => {
                    setEmail('admin@company.com');
                    setPassword('password123');
                  }}
                >
                  <Text style={styles.quickChipText}>Admin</Text>
                </Pressable>
                <Pressable
                  style={styles.quickChip}
                  onPress={() => {
                    setEmail('kanya@company.com');
                    setPassword('password123');
                  }}
                >
                  <Text style={styles.quickChipText}>Manager</Text>
                </Pressable>
                <Pressable
                  style={styles.quickChip}
                  onPress={() => {
                    setEmail('anong@company.com');
                    setPassword('password123');
                  }}
                >
                  <Text style={styles.quickChipText}>Employee</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.note}>
              เชื่อมต่อกับ API ผ่าน{' '}
              <Text style={styles.noteCode}>EXPO_PUBLIC_API_BASE_URL</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: HrColors.navy },
  bgTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: HrColors.navy,
    bottom: '50%',
  },
  bgBottom: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: HrColors.canvas,
    top: '50%',
  },
  kvContainer: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: HrColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...HrShadow.lg,
  },
  logoInner: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { color: '#fff', fontWeight: '900', fontSize: HrFont.xl, letterSpacing: -1 },
  brand: {
    color: '#fff',
    fontWeight: '800',
    fontSize: HrFont.sm,
    letterSpacing: 3,
    marginBottom: 6,
  },
  tagline: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: HrFont.sm,
  },
  card: {
    backgroundColor: HrColors.surface,
    borderRadius: HrRadius.xl,
    padding: 28,
    gap: 16,
    ...HrShadow.lg,
  },
  cardTitle: {
    color: HrColors.ink,
    fontSize: HrFont['2xl'],
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    color: HrColors.muted,
    fontSize: HrFont.sm,
    lineHeight: 20,
    marginTop: -4,
  },
  errorBanner: {
    backgroundColor: HrColors.redSoft,
    borderRadius: HrRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F5B8B4',
  },
  errorText: {
    color: HrColors.red,
    fontSize: HrFont.sm,
    fontWeight: '600',
  },
  fieldGroup: { gap: 6 },
  label: {
    color: HrColors.ink,
    fontSize: HrFont.sm,
    fontWeight: '600',
  },
  input: {
    backgroundColor: HrColors.canvas,
    borderWidth: 1.5,
    borderColor: HrColors.border,
    borderRadius: HrRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: HrColors.ink,
    fontSize: HrFont.base,
  },
  inputFocused: {
    borderColor: HrColors.blue,
    backgroundColor: HrColors.surface,
  },
  button: {
    backgroundColor: HrColors.blue,
    borderRadius: HrRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    ...HrShadow.md,
  },
  buttonPressed: { opacity: 0.82 },
  buttonLoading: { opacity: 0.65 },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: HrFont.base,
    letterSpacing: 0.2,
  },
  note: {
    color: HrColors.muted,
    textAlign: 'center',
    fontSize: HrFont.xs,
    lineHeight: 18,
    marginTop: 4,
  },
  noteCode: {
    color: HrColors.blue,
    fontWeight: '600',
  },
  quickFillContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: HrColors.borderLight,
    gap: 8,
  },
  quickFillLabel: {
    color: HrColors.muted,
    fontSize: HrFont.xs,
    textAlign: 'center',
  },
  quickFillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  quickChip: {
    backgroundColor: HrColors.blueSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: HrRadius.full,
    borderWidth: 1,
    borderColor: '#C7D9F8',
  },
  quickChipText: {
    color: HrColors.blue,
    fontSize: HrFont.xs,
    fontWeight: '700',
  },
});
