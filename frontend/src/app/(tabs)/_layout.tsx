import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HrColors, HrFont, HrShadow } from '@/constants/hr-theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'grid', inactive: 'grid-outline' },
  attendance: { active: 'time', inactive: 'time-outline' },
  leave: { active: 'calendar', inactive: 'calendar-outline' },
  employees: { active: 'people', inactive: 'people-outline' },
  profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: HrColors.blue,
        tabBarInactiveTintColor: HrColors.muted,
        tabBarLabelStyle: {
          fontSize: HrFont.xs,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: {
          borderTopColor: HrColors.borderLight,
          borderTopWidth: 1,
          backgroundColor: HrColors.surface,
          height: Platform.OS === 'ios' ? 82 : 62,
          paddingTop: 8,
          ...HrShadow.md,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons?.active : icons?.inactive;
          return <Ionicons name={iconName ?? 'ellipse-outline'} size={size ?? 22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'ภาพรวม' }} />
      <Tabs.Screen name="attendance" options={{ title: 'เวลางาน' }} />
      <Tabs.Screen name="leave" options={{ title: 'ลางาน' }} />
      <Tabs.Screen name="employees" options={{ title: 'ทีม' }} />
      <Tabs.Screen name="profile" options={{ title: 'โปรไฟล์' }} />
    </Tabs>
  );
}
