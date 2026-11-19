
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import { api } from '../../services/api';
import BottomNav from '../../components/BottomNav';

// ============================================
// TIPOS
// ============================================

type Challenge = {
  id: number;
  title: string;
  description: string;
  professionalArea: string;
  difficulty: string;
  requirements: string | null;
  deadline: string | null;
  status: string;
  organizationName: string;
};

type Application = {
  id: number;
  challengeId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

type Page<T> = {
  content: T[];
  totalPages: number;
  last: boolean;
};

type SubmissionRequest = {
  applicationId: number;
  description: string;
  fileUrl: string | null;
};

type Submission = {
  id: number;
  applicationId: number;
  description: string;
  fileUrl: string | null;
  status: string;
  submittedAt: string;
};

// ============================================
// CONFIGURAÇÕES
// ============================================

const ROXO = '#D56AFF';

const formatarData = (s: string | null) =>
  s && /^\d{4}-\d\d-\d\d/.test(s)
    ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`
    : 'Não informada';

const nivel = (s: string) =>
  ({
    EASY: 'Fácil',
    BEGINNER: 'Iniciante',
    MEDIUM: 'Intermediário',
    INTERMEDIATE: 'Intermediário',
    HARD: 'Avançado',
    ADVANCED: 'Avançado',
  } as Record<string, string>)[s] ||
  s ||
  'Não informado';

// ============================================
// MENSAGENS
// ============================================

function mensagem(titulo: string, texto: string) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${texto}`);
  } else {
    Alert.alert(titulo, texto);
  }
}

// ============================================
// AUTENTICAÇÃO
// ============================================

async function obterToken() {
  return Platform.OS === 'web'
    ? window.sessionStorage.getItem('ventrya_token')
    : SecureStore.getItemAsync('ventrya_token');
}

async function sair() {
  if (Platform.OS === 'web') {
    window.sessionStorage.removeItem('ventrya_token');
    window.sessionStorage.removeItem('ventrya_user');
  } else {
    await SecureStore.deleteItemAsync('ventrya_token');
    await SecureStore.deleteItemAsync('ventrya_user');
  }

  router.replace('/login');
}

// ============================================
// VERIFICAR ENTREGA EXISTENTE
// ============================================

// Consulta se alguma inscrição do desafio
// já possui uma entrega registrada.
//
// Um erro 404 representa ausência de entrega
// nessa rota. Outros erros não são tratados
// como ausência de entrega.

async function jaExisteEntrega(
  inscricoesDoDesafio: Application[],
  headers: { Authorization: string },
): Promise<boolean> {
  const resultados = await Promise.all(
    inscricoesDoDesafio.map(async (item) => {
      try {
        const { data } = await api.get<Submission>(
          `/api/submissions/application/${item.id}`,
          { headers },
        );

        if (
          !data ||
          typeof data.id !== 'number' ||
          data.applicationId !== item.id
        ) {
          throw new Error('Resposta de entrega inválida');
        }

        return true;
      } catch (e: unknown) {
        if (
          axios.isAxiosError(e) &&
          e.response?.status === 404
        ) {
          return false;
        }

        throw e;
      }
    }),
  );

  return resultados.some(Boolean);
}

// ============================================
// TELA PRINCIPAL
// ============================================

export default function DetalheDesafio() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [desafio, setDesafio] =
    useState<Challenge | null>(null);

  const [inscricao, setInscricao] =
    useState<Application | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [formularioAberto, setFormularioAberto] =
    useState(false);

  const [descricao, setDescricao] = useState('');
  const [linkArquivo, setLinkArquivo] = useState('');

  const [enviando, setEnviando] = useState(false);

  const envioEmAndamento = useRef(false);

  const [entregaConfirmada, setEntregaConfirmada] =
    useState(false);

  const [erroEnvio, setErroEnvio] = useState('');

  // ============================================
  // CARREGAR DESAFIO E ENTREGA
  // ============================================

  const carregar = useCallback(async () => {
    if (!id || !/^\d+$/.test(id)) {
      setErro('Identificador do desafio inválido.');
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro('');
    setErroEnvio('');

    try {
      const token = await obterToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Buscar desafio

      const { data: desafioAtual } =
        await api.get<Challenge>(
          `/api/challenges/${id}`,
          { headers },
        );

      setDesafio(desafioAtual);

      // Buscar inscrições do candidato

      const inscricoes: Application[] = [];

      for (let page = 0; page < 100; page++) {
        const { data } = await api.get<Page<Application>>(
          '/api/applications/me',
          {
            headers,
            params: {
              page,
              size: 50,
            },
          },
        );

        if (!Array.isArray(data.content)) {
          throw new Error('Resposta de inscrições inválida');
        }

        inscricoes.push(...data.content);

        if (
          data.last ||
          page + 1 >= data.totalPages
        ) {
          break;
        }
      }

      // Filtrar inscrições deste desafio

      const inscricoesDoDesafio = inscricoes.filter(
        item => item.challengeId === Number(id),
      );

      // Priorizar inscrição aprovada

      const inscricaoAtual =
        inscricoesDoDesafio.find(
          item => item.status === 'APPROVED',
        ) ||
        inscricoesDoDesafio[0] ||
        null;

      setInscricao(inscricaoAtual);

      // Consultar entrega existente no servidor

      const entregue = await jaExisteEntrega(
        inscricoesDoDesafio,
        headers,
      );

      setEntregaConfirmada(entregue);

      if (entregue) {
        setFormularioAberto(false);
      }

    } catch (e: unknown) {
      if (
        axios.isAxiosError(e) &&
        e.response?.status === 401
      ) {
        await sair();
        return;
      }

      const codigo = axios.isAxiosError(e)
        ? e.response?.status
        : undefined;

      setErro(
        codigo === 404
          ? 'Não foi possível localizar os dados deste desafio.'
          : 'Não conseguimos verificar seu desafio e suas entregas. Tente novamente.',
      );

    } finally {
      setCarregando(false);
    }
  }, [id]);

  // Atualizar sempre que voltar para a tela

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  // ============================================
  // INFORMAÇÕES DO DESAFIO
  // ============================================

  const requisitos = (desafio?.requirements || '')
    .split(/\r?\n|;|•/)
    .map(item => item.trim())
    .filter(Boolean);

  const status = entregaConfirmada
    ? 'Entrega realizada'
    : inscricao?.status === 'APPROVED'
      ? 'Inscrição aprovada'
      : inscricao?.status === 'PENDING'
        ? 'Inscrição em análise'
        : inscricao?.status === 'REJECTED'
          ? 'Inscrição não aprovada'
          : 'Você ainda não se inscreveu neste desafio';

  const podeEntregar =
    inscricao?.status === 'APPROVED';

  const descricaoValida =
    descricao.trim().length >= 20 &&
    descricao.trim().length <= 2000;

  const url = linkArquivo.trim();

  const linkValido =
    url.length === 0 ||
    (
      url.length <= 255 &&
      /^https?:\/\/.+$/i.test(url)
    );

  // ============================================
  // ENVIAR ENTREGA
  // ============================================

  async function enviarEntrega() {
    // Impedir clique repetido

    if (
      envioEmAndamento.current ||
      enviando ||
      entregaConfirmada
    ) {
      return;
    }

    if (!inscricao || !podeEntregar) {
      mensagem(
        'Entrega indisponível',
        'É necessário ter uma inscrição aprovada para enviar a solução.',
      );
      return;
    }

    if (!descricaoValida) {
      setErroEnvio(
        'A descrição precisa ter entre 20 e 2000 caracteres.',
      );
      return;
    }

    if (!linkValido) {
      setErroEnvio(
        'Informe um link http:// ou https:// válido, ou deixe o campo vazio.',
      );
      return;
    }

    envioEmAndamento.current = true;
    setEnviando(true);
    setErroEnvio('');

    try {
      const token = await obterToken();

      if (!token) {
        await sair();
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const payload: SubmissionRequest = {
        applicationId: inscricao.id,
        description: descricao.trim(),
        fileUrl: url || null,
      };

      await api.post(
        '/api/submissions',
        payload,
        { headers },
      );

      // Entrega realizada com sucesso

      setEntregaConfirmada(true);
      setFormularioAberto(false);

    } catch (e: unknown) {
      if (
        axios.isAxiosError(e) &&
        e.response?.status === 401
      ) {
        await sair();
        return;
      }

      // Entrega já existente

      if (
        axios.isAxiosError(e) &&
        e.response?.status === 409
      ) {
        setEntregaConfirmada(true);
        setFormularioAberto(false);
        return;
      }

      // Uma falha de conexão pode acontecer
      // depois de a API salvar a entrega.
      // Por isso, verificar antes de liberar
      // uma nova tentativa.

      try {
        const token = await obterToken();

        if (!token) {
          await sair();
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const inscricoes: Application[] = [];

        for (let page = 0; page < 100; page++) {
          const { data } =
            await api.get<Page<Application>>(
              '/api/applications/me',
              {
                headers,
                params: {
                  page,
                  size: 50,
                },
              },
            );

          if (!Array.isArray(data.content)) {
            throw new Error(
              'Lista de inscrições inválida',
            );
          }

          inscricoes.push(...data.content);

          if (
            data.last ||
            page + 1 >= data.totalPages
          ) {
            break;
          }
        }

        const relacionadas = inscricoes.filter(
          item => item.challengeId === Number(id),
        );

        const existe = await jaExisteEntrega(
          relacionadas,
          headers,
        );

        if (existe) {
          setEntregaConfirmada(true);
          setFormularioAberto(false);
          return;
        }

        const codigo = axios.isAxiosError(e)
          ? e.response?.status
          : undefined;

        setErroEnvio(
          codigo === 403
            ? 'Você não tem permissão para enviar esta solução.'
            : codigo === 400 || codigo === 422
              ? 'Confira a descrição e o link do projeto antes de enviar.'
              : 'A entrega não foi confirmada. Verifique a conexão e tente novamente.',
        );

      } catch {
        setErro(
          'Não foi possível confirmar se o projeto foi entregue. Tente novamente para consultar o servidor.',
        );
      }

    } finally {
      envioEmAndamento.current = false;
      setEnviando(false);
    }
  }

  // ============================================
  // INTERFACE
  // ============================================

  return (
    <LinearGradient
      colors={['#090410', '#160820', '#1C092A']}
      style={styles.screen}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.wrap}>

          {/* CABEÇALHO */}

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.back}
              accessibilityLabel="Voltar"
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <Text style={styles.headerText}>
              Detalhe do Desafio
            </Text>
          </View>

          {/* CARREGAMENTO */}

          {carregando ? (
            <View style={styles.center}>
              <ActivityIndicator
                color={ROXO}
                size="large"
              />
              <Text style={styles.muted}>
                Carregando desafio...
              </Text>
            </View>

          ) : erro ? (
            <View style={styles.card}>
              <Text style={styles.muted}>
                {erro}
              </Text>

              <TouchableOpacity
                onPress={() => void carregar()}
                style={styles.retryButton}
              >
                <Text style={styles.buttonText}>
                  Tentar novamente
                </Text>
              </TouchableOpacity>
            </View>

          ) : desafio ? (
            <>

              {/* IDENTIFICAÇÃO DO DESAFIO */}

              <View style={styles.hero}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name="code-slash"
                    size={29}
                    color="#E2A3FF"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>
                    {desafio.title}
                  </Text>

                  <View style={styles.pills}>
                    <Text style={styles.pill}>
                      {nivel(desafio.difficulty)}
                    </Text>

                    <Text style={styles.pill}>
                      {desafio.professionalArea ||
                        'Área não informada'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.description}>
                {desafio.description ||
                  'Sem descrição disponível.'}
              </Text>

              {!!desafio.organizationName && (
                <Text style={styles.org}>
                  Organização: {desafio.organizationName}
                </Text>
              )}

              {/* REQUISITOS */}

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  Requisitos
                </Text>

                {requisitos.length > 0 ? (
                  requisitos.map((requisito, indice) => (
                    <View
                      key={`${indice}-${requisito}`}
                      style={styles.reqRow}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        color={ROXO}
                        size={17}
                      />

                      <Text style={styles.reqText}>
                        {requisito}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.muted}>
                    Nenhum requisito adicional informado.
                  </Text>
                )}
              </View>

              {/* PRAZO */}

              <View style={styles.card}>
                <View style={styles.dateRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={22}
                    color="#DB8CFF"
                  />

                  <View>
                    <Text style={styles.sectionTitle}>
                      Entrega
                    </Text>

                    <Text style={styles.muted}>
                      Até {formatarData(desafio.deadline)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* STATUS DO CANDIDATO */}

              <View style={styles.statusBox}>
                <Ionicons
                  name={
                    entregaConfirmada
                      ? 'checkmark-circle'
                      : podeEntregar
                        ? 'checkmark-circle-outline'
                        : 'information-circle-outline'
                  }
                  size={18}
                  color={
                    entregaConfirmada
                      ? '#A8F0C7'
                      : '#DDA5FF'
                  }
                />

                <Text style={styles.statusText}>
                  {status}
                </Text>
              </View>

              {/* ENTREGA CONCLUÍDA */}

              {entregaConfirmada ? (
                <View style={styles.successBox}>
                  <Ionicons
                    name="checkmark-circle"
                    color="#A8F0C7"
                    size={25}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.successTitle}>
                      Entrega realizada
                    </Text>

                    <Text style={styles.successText}>
                      Você já realizou a entrega deste desafio.
                      Acesse sua candidatura para acompanhar
                      o andamento da avaliação.
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        router.push('/avaliacoes')
                      }
                      style={styles.followButton}
                      accessibilityRole="button"
                      accessibilityLabel="Acompanhar avaliação"
                    >
                      <Ionicons
                        name="stats-chart-outline"
                        color="#FFFFFF"
                        size={17}
                      />

                      <Text style={styles.followText}>
                        Acompanhar avaliação
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

              ) : podeEntregar ? (
                <>

                  {/* BOTÃO DE ENVIAR */}

                  {!formularioAberto ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() =>
                        setFormularioAberto(true)
                      }
                    >
                      <LinearGradient
                        colors={['#B343E8', '#8E24C8']}
                        style={styles.buttonGradient}
                      >
                        <Ionicons
                          name="cloud-upload-outline"
                          size={19}
                          color="#FFFFFF"
                        />

                        <Text style={styles.buttonText}>
                          Enviar entrega
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                  ) : (

                    /* FORMULÁRIO */

                    <View style={styles.formCard}>
                      <Text style={styles.sectionTitle}>
                        Enviar minha solução
                      </Text>

                      <Text style={styles.formHint}>
                        Descreva o que você desenvolveu.
                        O link do projeto é opcional.
                      </Text>

                      <Text style={styles.fieldLabel}>
                        Descrição da solução *
                      </Text>

                      <TextInput
                        style={[
                          styles.input,
                          styles.textarea,
                        ]}
                        placeholder="Explique sua implementação, tecnologias e resultados..."
                        placeholderTextColor="#9D86AC"
                        multiline
                        textAlignVertical="top"
                        value={descricao}
                        onChangeText={setDescricao}
                        maxLength={2000}
                        editable={!enviando}
                      />

                      <Text
                        style={[
                          styles.counter,
                          descricao.length > 0 &&
                            !descricaoValida &&
                            styles.invalid,
                        ]}
                      >
                        {descricao.trim().length}/2000
                        caracteres (mínimo 20)
                      </Text>

                      <Text style={styles.fieldLabel}>
                        Link do projeto (opcional)
                      </Text>

                      <TextInput
                        style={styles.input}
                        placeholder="https://github.com/..."
                        placeholderTextColor="#9D86AC"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        value={linkArquivo}
                        onChangeText={setLinkArquivo}
                        maxLength={255}
                        editable={!enviando}
                      />

                      {url.length > 0 &&
                        !linkValido && (
                          <Text style={styles.invalid}>
                            Informe um link http://
                            ou https:// válido.
                          </Text>
                        )}

                      {!!erroEnvio && (
                        <Text style={styles.errorInline}>
                          {erroEnvio}
                        </Text>
                      )}

                      <TouchableOpacity
                        disabled={
                          enviando ||
                          !descricaoValida ||
                          !linkValido
                        }
                        activeOpacity={0.85}
                        onPress={() =>
                          void enviarEntrega()
                        }
                        style={{
                          opacity:
                            enviando ||
                            !descricaoValida ||
                            !linkValido
                              ? 0.5
                              : 1,
                        }}
                      >
                        <LinearGradient
                          colors={['#B343E8', '#8E24C8']}
                          style={styles.buttonGradient}
                        >
                          {enviando ? (
                            <ActivityIndicator
                              color="#FFFFFF"
                            />
                          ) : (
                            <Ionicons
                              name="paper-plane-outline"
                              size={18}
                              color="#FFFFFF"
                            />
                          )}

                          <Text style={styles.buttonText}>
                            {enviando
                              ? 'Enviando...'
                              : 'Confirmar entrega'}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={enviando}
                        onPress={() =>
                          setFormularioAberto(false)
                        }
                        style={styles.cancelButton}
                      >
                        <Text style={styles.cancelText}>
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>

              ) : (
                <View style={styles.infoBox}>
                  <Text style={styles.muted}>
                    O envio da solução fica disponível
                    após a aprovação da sua inscrição.
                  </Text>
                </View>
              )}
            </>
          ) : null}
        </View>
      </ScrollView>

      <BottomNav />
    </LinearGradient>
  );
}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scroll: {
    paddingHorizontal: 18,
    paddingTop: 30,
    paddingBottom: 32,
    alignItems: 'center',
  },

  wrap: {
    width: '100%',
    maxWidth: 520,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 29,
  },

  back: {
    padding: 4,
  },

  headerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 19,
  },

  iconBox: {
    width: 65,
    height: 65,
    borderRadius: 13,
    backgroundColor: '#3E1C55',
    borderWidth: 1,
    borderColor: '#754194',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 9,
  },

  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  pill: {
    color: '#E7BBFF',
    backgroundColor: '#472157',
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 10,
    borderRadius: 7,
  },

  description: {
    color: '#E6D8ED',
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 12,
  },

  org: {
    color: '#BDA6CB',
    fontSize: 11,
    marginBottom: 18,
  },

  card: {
    backgroundColor: '#21102E',
    borderColor: '#64347E',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 9,
  },

  reqRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 7,
  },

  reqText: {
    flex: 1,
    color: '#E2D1EA',
    fontSize: 12,
    lineHeight: 19,
  },

  muted: {
    color: '#BFA9CE',
    fontSize: 12,
    lineHeight: 19,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 12,
  },

  statusText: {
    color: '#E1B6F5',
    fontSize: 12,
    flex: 1,
  },

  buttonGradient: {
    paddingVertical: 15,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 7,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },

  retryButton: {
    backgroundColor: '#8E24C8',
    borderRadius: 11,
    paddingVertical: 14,
    marginTop: 14,
  },

  center: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 12,
  },

  formCard: {
    backgroundColor: '#21102E',
    borderColor: '#64347E',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },

  formHint: {
    color: '#BFA9CE',
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 16,
  },

  fieldLabel: {
    color: '#E8C7F7',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
  },

  input: {
    color: '#FFFFFF',
    backgroundColor: '#14091E',
    borderWidth: 1,
    borderColor: '#6A3C82',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    marginBottom: 9,
  },

  textarea: {
    minHeight: 140,
  },

  counter: {
    color: '#BFA9CE',
    fontSize: 11,
    textAlign: 'right',
    marginBottom: 18,
  },

  invalid: {
    color: '#FFB0BB',
    fontSize: 11,
    marginBottom: 9,
  },

  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },

  cancelText: {
    color: '#CBB3D8',
    fontSize: 13,
    fontWeight: '700',
  },

  infoBox: {
    backgroundColor: '#291736',
    borderRadius: 12,
    padding: 15,
    marginTop: 7,
  },

  successBox: {
    backgroundColor: '#19382F',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },

  successTitle: {
    color: '#C6FADF',
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 6,
  },

  successText: {
    color: '#B7F2D2',
    fontSize: 12,
    lineHeight: 19,
  },

  followButton: {
    backgroundColor: '#73409A',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  followText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  errorInline: {
    color: '#FFB0BB',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
});
