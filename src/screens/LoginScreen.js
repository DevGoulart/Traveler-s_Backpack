import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSocial } from '../context/SocialContext';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

function getAuthErrorMessage(error) {
  switch (error?.message) {
    case 'INVALID_CREDENTIALS':
      return 'Usuário ou senha inválidos.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
}

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login, restoreBiometric } = useSocial();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef(null);

  const handleLogin = async () => {
    if (!user.trim() || !password) {
      Alert.alert('Campos obrigatórios', 'Preencha usuário e senha.');
      return;
    }

    setLoading(true);
    try {
      await login(user.trim(), password);
    } catch (error) {
      Alert.alert('Erro ao entrar', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loginBiometria = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      Alert.alert('Indisponível', 'Seu dispositivo não suporta biometria.');
      return;
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      Alert.alert('Biometria não configurada', 'Configure biometria no seu dispositivo primeiro.');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Entrar com biometria',
      cancelLabel: 'Cancelar',
    });

    if (result.success) {
      setLoading(true);
      try {
        await restoreBiometric();
      } catch {
        Alert.alert(
          'Biometria indisponível',
          'Faça login com usuário e senha pelo menos uma vez antes de usar a biometria.'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Ionicons name="airplane" size={36} color={colors.primary} />
            </View>
            <Text style={styles.title}>Traveler's Backpack</Text>
            <Text style={styles.subtitle}>Suas aventuras, compartilhadas com o mundo</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Entrar</Text>

            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <TextInput
                placeholder="Usuário"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={user}
                onChangeText={setUser}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              <TextInput
                placeholder="Senha"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                ref={passwordRef}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <Pressable
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Entrar</Text>
              )}
            </Pressable>

            <Pressable style={styles.bioButton} onPress={loginBiometria}>
              <Ionicons name="finger-print" size={20} color={colors.primary} />
              <Text style={styles.bioText}>Entrar com biometria</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Criar conta</Text>
            </Pressable>
          </View>

          <Text style={styles.demoHint}>Demo: admin / 123</Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  bioText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  demoHint: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.lg,
  },
});
