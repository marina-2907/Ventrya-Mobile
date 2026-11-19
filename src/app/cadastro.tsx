
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';

import { api } from '../services/api';

import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';

// ============================================
// ÁREAS PROFISSIONAIS
// ============================================

const areas = [
  { label: 'Tecnologia', value: 'TECHNOLOGY' },
  { label: 'Administração', value: 'ADMINISTRATION' },
  { label: 'Marketing', value: 'MARKETING' },
  { label: 'Design', value: 'DESIGN' },
  { label: 'Finanças', value: 'FINANCE' },
  { label: 'Outros', value: 'OTHER' },
];

// ============================================
// TELA DE CADASTRO VENTRYA
// ============================================

export default function CadastroScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] =
    useState(false);
  const [mostrarAreas, setMostrarAreas] = useState(false);

  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // ==========================================
  // VALIDAÇÃO DOS CAMPOS
  // ==========================================

  function validar(): boolean {
    setErro('');

    if (
      !nome.trim() ||
      !email.trim() ||
      !area ||
      !senha ||
      !confirmarSenha
    ) {
      setErro('Preencha todos os campos.');
      return false;
    }

    if (nome.trim().length < 3) {
      setErro('O nome deve ter pelo menos 3 caracteres.');
      return false;
    }

    const emailLimpo = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      setErro('Informe um e-mail válido.');
      return false;
    }

    if (senha.length < 8 || senha.length > 72) {
      setErro('A senha deve ter entre 8 e 72 caracteres.');
      return false;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return false;
    }

    return true;
  }

  // ==========================================
  // CADASTRO NA API JAVA
  // ==========================================

  async function cadastrar(): Promise<void> {
    // Evita novos envios enquanto aguarda a API.
    if (loading) {
      return;
    }

    // As validações só executam ao clicar.
    if (!validar()) {
      return;
    }

    if (!aceitouTermos) {
      setErro(
        'Confirme que leu as informações de uso.'
      );
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const dadosCadastro = {
        name: nome.trim(),
        email: email.trim().toLowerCase(),
        password: senha,
        professionalArea: area,
      };

      // Enviar cadastro para a API.
      // O backend é responsável pela persistência.

      await api.post(
        '/api/auth/register',
        dadosCadastro
      );

      // Cadastro aceito pela API.
      setSenha('');
      setConfirmarSenha('');

      const titulo = 'Conta criada com sucesso!';

      const texto =
        'Seu cadastro foi realizado. ' +
        'Agora você pode entrar no Ventrya.';

      if (Platform.OS === 'web') {
        window.alert(`${titulo}\n\n${texto}`);
        router.replace('/login');
      } else {
        Alert.alert(
          titulo,
          texto,
          [
            {
              text: 'Ir para o login',
              onPress: () => {
                router.replace('/login');
              },
            },
          ]
        );
      }

    } catch (error: unknown) {
      // Tratar respostas da API de maneira amigável.

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (!error.response) {
          setErro(
            'Não foi possível conectar à API. ' +
            'Confira sua conexão e tente novamente.'
          );
          return;
        }

        if (status === 409) {
          setErro(
            'Este e-mail já possui uma conta. ' +
            'Tente entrar com suas credenciais.'
          );
          return;
        }

        if (status === 400 || status === 422) {
          setErro(
            'Não foi possível validar o cadastro. ' +
            'Confira os dados informados.'
          );
          return;
        }

        if (status === 429) {
          setErro(
            'Muitas tentativas de cadastro. ' +
            'Tente novamente mais tarde.'
          );
          return;
        }

        if (status === 401 || status === 403) {
          setErro(
            'O servidor não autorizou o cadastro.'
          );
          return;
        }

        setErro(
          'Não foi possível concluir seu cadastro. ' +
          'Tente novamente.'
        );

      } else {
        setErro(
          'Ocorreu um problema inesperado. ' +
          'Tente novamente.'
        );
      }

    } finally {
      // Executado após sucesso ou erro.
      setLoading(false);
    }
  }

  // ==========================================
  // INTERFACE
  // ==========================================

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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>

            {/* VOLTAR */}

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/login')}
              accessibilityRole="button"
              accessibilityLabel="Voltar para login"
            >
              <Ionicons
                name="arrow-back"
                size={23}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* LOGOTIPO */}

            <View style={styles.brand}>
              <Svg
                width={76}
                height={76}
                viewBox="0 0 120 120"
              >
                <Defs>
                  <SvgGradient
                    id="cadastroLogo"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <Stop
                      offset="0"
                      stopColor="#F6A4FF"
                    />
                    <Stop
                      offset="0.45"
                      stopColor="#D13AFF"
                    />
                    <Stop
                      offset="1"
                      stopColor="#8500D8"
                    />
                  </SvgGradient>
                </Defs>

                <Path
                  d="M12 20 C9 14 13 10 20 10 H35
                     C40 10 43 13 46 19 L61 55
                     L78 19 C81 13 85 10 91 10
                     H107 C113 10 115 15 112 21
                     L76 100 C70 113 52 113 46 100 Z"
                  fill="url(#cadastroLogo)"
                />
              </Svg>

              <Text style={styles.brandName}>
                Ventrya
              </Text>
            </View>

            {/* TÍTULOS */}

            <Text style={styles.title}>
              Criar conta
            </Text>

            <Text style={styles.subtitle}>
              Comece sua jornada no Ventrya.
            </Text>

            {/* FORMULÁRIO */}

            <View style={styles.form}>

              {/* NOME */}

              <View style={styles.inputBox}>
                <Ionicons
                  name="person-outline"
                  size={19}
                  color="#C58ADC"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Nome completo"
                  placeholderTextColor="#9987AA"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                  autoComplete="name"
                  maxLength={255}
                  editable={!loading}
                />
              </View>

              {/* E-MAIL */}

              <View style={styles.inputBox}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color="#C58ADC"
                />

                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="#9987AA"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!loading}
                />
              </View>

              {/* ÁREA PROFISSIONAL */}

              <TouchableOpacity
                style={styles.inputBox}
                onPress={() =>
                  setMostrarAreas(!mostrarAreas)
                }
                disabled={loading}
                accessibilityRole="button"
              >
                <Ionicons
                  name="briefcase-outline"
                  size={19}
                  color="#C58ADC"
                />

                <Text
                  style={[
                    styles.selectText,
                    !area && styles.placeholder,
                  ]}
                >
                  {areas.find(
                    item => item.value === area
                  )?.label || 'Área de interesse'}
                </Text>

                <Ionicons
                  name={
                    mostrarAreas
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={18}
                  color="#C58ADC"
                />
              </TouchableOpacity>

              {/* OPÇÕES DE ÁREA */}

              {mostrarAreas && (
                <View style={styles.dropdown}>
                  {areas.map(item => (
                    <TouchableOpacity
                      key={item.value}
                      style={styles.option}
                      disabled={loading}
                      onPress={() => {
                        setArea(item.value);
                        setMostrarAreas(false);
                      }}
                    >
                      <Text style={styles.optionText}>
                        {item.label}
                      </Text>

                      {area === item.value && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color="#D45AFF"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* SENHA */}

              <View style={styles.inputBox}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#C58ADC"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#9987AA"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  maxLength={72}
                  editable={!loading}
                />

                <TouchableOpacity
                  onPress={() =>
                    setMostrarSenha(!mostrarSenha)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    mostrarSenha
                      ? 'Ocultar senha'
                      : 'Mostrar senha'
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

              {/* CONFIRMAR SENHA */}

              <View style={styles.inputBox}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color="#C58ADC"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirmar senha"
                  placeholderTextColor="#9987AA"
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  secureTextEntry={!mostrarConfirmacao}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  maxLength={72}
                  editable={!loading}
                />

                <TouchableOpacity
                  onPress={() =>
                    setMostrarConfirmacao(
                      !mostrarConfirmacao
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    mostrarConfirmacao
                      ? 'Ocultar confirmação'
                      : 'Mostrar confirmação'
                  }
                >
                  <Ionicons
                    name={
                      mostrarConfirmacao
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={20}
                    color="#C58ADC"
                  />
                </TouchableOpacity>
              </View>

              {/* ACEITE DE USO */}

              <TouchableOpacity
                style={styles.termsRow}
                disabled={loading}
                onPress={() =>
                  setAceitouTermos(!aceitouTermos)
                }
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: aceitouTermos,
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    aceitouTermos &&
                      styles.checkboxChecked,
                  ]}
                >
                  {aceitouTermos && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color="#FFFFFF"
                    />
                  )}
                </View>

                <Text style={styles.termsText}>
                  Li as informações e concordo em utilizar
                  o Ventrya de maneira responsável.
                </Text>
              </TouchableOpacity>

              {/* MENSAGEM DE ERRO */}

              {!!erro && (
                <Text style={styles.error}>
                  {erro}
                </Text>
              )}

              {/* BOTÃO CADASTRAR */}

              <TouchableOpacity
                onPress={() => {
                  void cadastrar();
                }}
                disabled={loading}
                activeOpacity={0.85}
                style={[
                  styles.buttonWrapper,
                  loading && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Criar conta"
              >
                <LinearGradient
                  colors={[
                    '#D45AFF',
                    '#9A20DE',
                    '#7613B8',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.button}
                >
                  {loading ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text style={styles.buttonText}>
                      Cadastrar
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* IR PARA LOGIN */}

            <TouchableOpacity
              onPress={() =>
                router.replace('/login')
              }
              style={styles.footer}
              accessibilityRole="button"
            >
              <Text style={styles.footerText}>
                Já tem uma conta?{' '}
                <Text style={styles.footerLink}>
                  Entrar
                </Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 30,
  },

  content: {
    width: '100%',
    maxWidth: 390,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    padding: 6,
  },

  brand: {
    alignItems: 'center',
    marginBottom: 18,
  },

  brandName: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: -6,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    color: '#B8A7C9',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 28,
  },

  form: {
    gap: 13,
  },

  inputBox: {
    minHeight: 54,
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

  selectText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },

  placeholder: {
    color: '#9987AA',
  },

  dropdown: {
    backgroundColor: '#24152F',
    borderColor: '#604071',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },

  option: {
    minHeight: 43,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#604071',
  },

  optionText: {
    color: '#E9DDF2',
    fontSize: 13,
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 7,
  },

  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#B86AE8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: '#9A20DE',
  },

  termsText: {
    flex: 1,
    color: '#C5B2D3',
    fontSize: 12,
    lineHeight: 19,
  },

  error: {
    color: '#FF9DAA',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
  },

  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 9,
  },

  button: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  footer: {
    marginTop: 27,
    alignItems: 'center',
    paddingVertical: 8,
  },

  footerText: {
    color: '#B8A7C9',
    fontSize: 13,
  },

  footerLink: {
    color: '#D67BFF',
    fontWeight: '700',
  },
});
