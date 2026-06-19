import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocial } from '../context/SocialContext';
import { useTheme } from '../context/ThemeContext';
import { useAppInsets } from '../hooks/useAppInsets';
import spacing from '../theme/spacing';

export default function SettingsScreen({ navigation }) {
  const { top, bottomPadding } = useAppInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { logout } = useSocial();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const ferramentas = [
    { nome: 'Biometria', rota: 'Biometria', icon: 'finger-print-outline' },
    { nome: 'Juros', rota: 'Juros', icon: 'calculator-outline' },
    { nome: 'Mapa', rota: 'Mapa', icon: 'map-outline' },
    { nome: 'Todo', rota: 'Todo', icon: 'checkbox-outline' },
  ];

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + spacing.xxl }]}
      >
        <Text style={styles.sectionTitle}>Conta</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="person-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.menuText}>Editar perfil</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Aparência</Text>

        <View style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={22} color={colors.primary} />
          </View>
          <Text style={styles.menuText}>Modo escuro</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={colors.surface}
          />
        </View>

        <Text style={styles.sectionTitle}>Ferramentas</Text>

        {ferramentas.map((item) => (
          <TouchableOpacity
            key={item.rota}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.rota)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
            </View>
            <Text style={styles.menuText}>{item.nome}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 32,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    headerSpacer: {
      width: 32,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl * 2,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      marginBottom: spacing.sm,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    menuIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.xl,
      paddingVertical: spacing.lg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: colors.surface,
    },
    logoutText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.danger,
    },
  });
}
