import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HrColors, HrFont, HrRadius, HrShadow } from '@/constants/hr-theme';

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Use 'hero' for dark navy gradient header, 'plain' (default) for light surface header */
  headerVariant?: 'hero' | 'plain';
}>;

export function HrScreen({ title, subtitle, action, children, headerVariant = 'plain' }: ScreenProps) {
  const isHero = headerVariant === 'hero';
  return (
    <SafeAreaView style={[styles.safeArea, isHero && styles.safeAreaHero]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isHero ? styles.headerHero : styles.headerPlain]}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, isHero && styles.titleHero]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, isHero && styles.subtitleHero]}>{subtitle}</Text>
          ) : null}
        </View>
        {action}
      </View>
      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

type SectionCardProps = PropsWithChildren<{
  /** 'default' white card | 'accent' blue-tinted | 'success' green-tinted | 'warning' amber-tinted */
  variant?: 'default' | 'accent' | 'success' | 'warning';
  noPadding?: boolean;
}>;

export function SectionCard({ children, variant = 'default', noPadding = false }: SectionCardProps) {
  const variantStyle =
    variant === 'accent'
      ? styles.cardAccent
      : variant === 'success'
        ? styles.cardSuccess
        : variant === 'warning'
          ? styles.cardWarning
          : styles.cardDefault;
  return (
    <View style={[styles.card, variantStyle, noPadding && styles.cardNoPadding]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: HrColors.canvas },
  safeAreaHero: { backgroundColor: HrColors.navy },
  scroll: { flex: 1, backgroundColor: HrColors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  headerPlain: {
    backgroundColor: HrColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: HrColors.borderLight,
    ...HrShadow.sm,
  },
  headerHero: {
    backgroundColor: HrColors.navy,
    paddingBottom: 24,
    paddingTop: 12,
  },
  titleBlock: { flex: 1, gap: 4 },
  title: { color: HrColors.ink, fontSize: HrFont.xl, fontWeight: '700', letterSpacing: -0.5 },
  titleHero: { color: '#FFFFFF', fontSize: HrFont['2xl'] },
  subtitle: { color: HrColors.muted, fontSize: HrFont.sm, lineHeight: 20 },
  subtitleHero: { color: 'rgba(255,255,255,0.70)' },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 120,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  card: {
    borderRadius: HrRadius.lg,
    padding: 18,
    ...HrShadow.sm,
  },
  cardDefault: {
    backgroundColor: HrColors.surface,
    borderWidth: 1,
    borderColor: HrColors.borderLight,
  },
  cardAccent: {
    backgroundColor: HrColors.blueSoft,
    borderWidth: 1,
    borderColor: '#C7DDF6',
  },
  cardSuccess: {
    backgroundColor: HrColors.greenSoft,
    borderWidth: 1,
    borderColor: '#B7E5D4',
  },
  cardWarning: {
    backgroundColor: HrColors.amberSoft,
    borderWidth: 1,
    borderColor: '#F5D98A',
  },
  cardNoPadding: { padding: 0 },
});
