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
import { useSocial } from '../context/SocialContext';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

function getRegisterErrorMessage(error) {
  switch (error?.message) {
    case 'USER_EXISTS':
      return 'Este usuário já está em uso. Escolha outro.';
    case 'LOGIN_TOO_SHORT':
      return 'O usuário deve ter pelo menos 3 caracteres.';
    case 'PASSWORD_TOO_SHORT':
      return 'A senha deve ter pelo menos 4 caracteres.';
    default:
      return 'Não foi possível criar a conta. Tente novamente.';
  }
}

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { register } = useSocial();
  const [login, setLogin] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayNameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const handleRegister = async () => {
    const trimmedLogin = login.trim();
    const trimmedName = displayName.trim();

    if (!trimmedLogin || !password || !confirmPassword) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'A confirmação de senha não confere.');
      return;
    }

    setLoading(true);
    try {
      await register(trimmedLogin, trimmedName || trimmedLogin, password);
    } catch (error) {
      Alert.alert('Erro ao criar conta', getRegisterErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.md }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
              <Ionicons name="arrow-back" size={26} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Criar conta</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Ionicons name="person-add-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>Junte-se à aventura</Text>
            <Text style={styles.subtitle}>Crie sua conta e comece a compartilhar suas viagens</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Usuário *</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="at-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  placeholder="ex: maria_viagens"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={login}
                  onChangeText={setLogin}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => displayNameRef.current?.focus()}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nome de exibição</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  placeholder="Como aparecerá no perfil"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  ref={displayNameRef}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  maxLength={30}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha *</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  placeholder="Mínimo 4 caracteres"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  ref={passwordRef}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirmar senha *</Text>
              <View style={styles.inputGroup}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  placeholder="Repita a senha"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  ref={confirmRef}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
              </View>
            </View>

            <Pressable
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Criar conta</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.footerLink}>Entrar</Text>
            </Pressable>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  headerSpacer: {
    width: 26,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
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
});
