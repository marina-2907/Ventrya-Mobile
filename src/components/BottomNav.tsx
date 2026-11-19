import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, router } from 'expo-router';

type Tab = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
  route: string;
  enabled: boolean;
};
const tabs: Tab[] = [
  { label: 'Início', icon: 'home-outline', activeIcon: 'home', route: '/painel', enabled: true },
  { label: 'Desafios', icon: 'rocket-outline', activeIcon: 'rocket', route: '/desafios', enabled: true },
  { label: 'Avaliações', icon: 'ribbon-outline', activeIcon: 'ribbon', route: '/avaliacoes', enabled: true },
  { label: 'IA', icon: 'sparkles-outline', activeIcon: 'sparkles', route: '/ia', enabled: true },
  { label: 'Perfil', icon: 'person-outline', activeIcon: 'person', route: '/perfil', enabled: true },
];
export default function BottomNav() {
  const pathname = usePathname();
  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        {tabs.map((tab) => {
          const active = pathname === tab.route;
          return (
            <TouchableOpacity key={tab.label} style={styles.tab} activeOpacity={0.7}
              disabled={!tab.enabled} accessibilityRole="tab"
              accessibilityState={{ selected: active, disabled: !tab.enabled }}
              accessibilityLabel={tab.label}
              onPress={() => { if (tab.enabled && !active) router.replace(tab.route as any); }}>
              {active && <View style={styles.activeIndicator} />}
              <Ionicons name={active ? tab.activeIcon : tab.icon} size={21}
                color={active ? '#D86AFF' : tab.enabled ? '#A99AB6' : '#786884'} />
              <Text style={[styles.label, active && styles.activeLabel, !tab.enabled && styles.disabledLabel]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { backgroundColor: '#13091D', borderTopWidth: 1, borderTopColor: '#40224F', paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 3, width: '100%' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', maxWidth: 600, alignSelf: 'center' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, gap: 5, position: 'relative' },
  activeIndicator: { position: 'absolute', top: 0, width: 28, height: 3, borderRadius: 4, backgroundColor: '#D86AFF' },
  label: { color: '#A99AB6', fontSize: 10, fontWeight: '500' },
  activeLabel: { color: '#E4A2FF', fontWeight: '800' },
  disabledLabel: { color: '#786884' },
});
