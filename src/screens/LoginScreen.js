import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useRef } from 'react';

export default function LoginScreen({ navigation }) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');

  const passwordRef = useRef();

  const loginBiometria = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Entrar com biometria',
    });

    if (result.success) {
      navigation.replace('Home');
    }
  };

  const loginNormal = () => {
    if (user === 'admin' && password === '123') {
      navigation.replace('Home');
    } else {
      alert('Usuário ou senha inválidos');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >

          <Text style={styles.title}>Traveler's Backpack</Text>

          <TextInput
            placeholder="Usuário"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={user}
            onChangeText={setUser}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current.focus()}
          />

          <TextInput
            placeholder="Senha"
            placeholderTextColor="#aaa"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            ref={passwordRef}
            returnKeyType="done"
          />

          <TouchableOpacity style={styles.button} onPress={loginNormal}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bioButton} onPress={loginBiometria}>
            <Text style={styles.bioText}>Entrar com biometria</Text>
          </TouchableOpacity>

        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#d9fdd3',
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 32,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#2e7d32',
  },

  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  button: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  bioButton: {
    marginTop: 20,
    alignItems: 'center',
  },

  bioText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
});
