
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import axios from 'axios';
import { api } from '../services/api';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const isMobile = width < 600;

  async function entrar() {
    setErro('');

    if (!email.trim() || !senha) {
      setErro('Preencha seu e-mail e sua senha.');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password: senha,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('Resposta de login inválida.');
      }

      if (Platform.OS === 'web') {
        window.sessionStorage.setItem('ventrya_token', token);
        window.sessionStorage.setItem(
          'ventrya_user',
          JSON.stringify(user)
        );
      } else {
        await SecureStore.setItemAsync('ventrya_token', token);
        await SecureStore.setItemAsync(
          'ventrya_user',
          JSON.stringify(user)
        );
      }

      router.replace('/painel');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setErro('E-mail ou senha incorretos.');
        } else if (!error.response) {
          setErro(
            'Não foi possível conectar à API. Verifique o servidor.'
          );
        } else {
          setErro('Erro ao entrar. Tente novamente.');
        }
      } else {
        setErro('Não foi possível concluir o login.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={['#08040E', '#12051F', '#1C082B']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.content,
              { maxWidth: isMobile ? 420 : 390 },
            ]}
          >
            <View style={styles.brand}>
              <Svg width={76} height={76} viewBox="0 0 120 120">
                <Defs>
                  <SvgGradient
                    id="loginLogoGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <Stop offset="0" stopColor="#F6A4FF" />
                    <Stop offset="0.45" stopColor="#D13AFF" />
                    <Stop offset="1" stopColor="#8500D8" />
                  </SvgGradient>
                </Defs>
                <Path
                  d="M12 20
                     C9 14 13 10 20 10
                     H35
                     C40 10 43 13 46 19
                     L61 55
                     L78 19
                     C81 13 85 10 91 10
                     H107
                     C113 10 115 15 112 21
                     L76 100
                     C70 113 52 113 46 100
                     Z"
                  fill="url(#loginLogoGradient)"
                />
              </Svg>
              <Text style={styles.brandName}>Ventrya</Text>
            </View>

            <Text style={styles.title}>Bem-vinda de volta!</Text>
            <Text style={styles.subtitle}>
              Acesse sua conta e continue sua jornada.
            </Text>

            <View style={styles.form}>
              <View style={styles.inputBox}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color="#C58ADC"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Seu e-mail"
                  placeholderTextColor="#9987AA"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputBox}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#C58ADC"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Sua senha"
                  placeholderTextColor="#9987AA"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setMostrarSenha(!mostrarSenha)}
                  accessibilityLabel={
                    mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'
                  }
                >
                  <Ionicons
                    name={
                      mostrarSenha
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={20}
                    color="#C58ADC"
                  />
                </TouchableOpacity>
              </View>

              {erro ? (
                <Text style={styles.error}>{erro}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.loginTouchable}
                onPress={entrar}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#D45AFF', '#9A20DE', '#7613B8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.loginButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.buttonRow}>
                      <Text style={styles.loginText}>Entrar</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.googleButton}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>
                Continuar com Google
              </Text>
              <Text style={styles.comingSoon}>Em breve</Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/cadastro')}
              style={styles.registerButton}
            >
              <Text style={styles.registerText}>
                Não tem uma conta?{' '}
                <Text style={styles.registerLink}>
                  Cadastre-se
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 45,
  },
  content: {
    width: '100%',
    alignItems: 'stretch',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 30,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 35,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: -3,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 9,
  },
  subtitle: {
    color: '#B8A7C9',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
    gap: 15,
  },
  inputBox: {
    height: 55,
    borderWidth: 1,
    borderColor: '#604071',
    backgroundColor: '#24152F',
    borderRadius: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  error: {
    color: '#FF9DAA',
    fontSize: 13,
    textAlign: 'center',
  },
  loginTouchable: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginButton: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 28,
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#604071',
  },
  dividerText: {
    color: '#B8A7C9',
    fontSize: 13,
  },
  googleButton: {
    minHeight: 53,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#604071',
    backgroundColor: '#1C1027',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    opacity: 0.65,
  },
  googleIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  googleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  comingSoon: {
    color: '#BFA4D2',
    fontSize: 10,
  },
  registerButton: {
    marginTop: 31,
    paddingVertical: 8,
  },
  registerText: {
    color: '#B8A7C9',
    textAlign: 'center',
    fontSize: 13,
  },
  registerLink: {
    color: '#D67BFF',
    fontWeight: '700',
  },
});
