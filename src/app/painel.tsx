
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Svg, {
  Circle,
  Ellipse,
  Path,
  Rect,
} from 'react-native-svg';
import axios from 'axios';

import { api } from '../services/api';
import BottomNav from '../components/BottomNav';

// ============================================
// TIPOS
// ============================================

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

type Application = {
  id: number;
  challengeId: number;
  challengeTitle: string;
  status: Status;
  appliedAt: string;
};

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

type Page<T> = {
  content: T[];
  totalPages: number;
  last: boolean;
};

type Avatar = {
  modelo: 'menina' | 'menino';
  pele: number;
  cabelo: number;
  corCabelo: number;
  roupa: number;
  oculos: boolean;
  barba: boolean;
};

// ============================================
// PALETA VENTRYA
// ============================================

const C = {
  fundo: '#090511',
  card: '#20102D',
  borda: '#5F3875',
  texto: '#FFFFFF',
  suave: '#D4C1DF',
  roxo: '#D85EFF',
  roxoClaro: '#EDBEFF',
  verde: '#9EF2C5',
  amarelo: '#FFD28A',
  vermelho: '#FFADB8',
};

const PELES = [
  '#F5D8C1',
  '#E7BA98',
  '#C98D64',
  '#A96B48',
  '#78462F',
  '#442A24',
];

const CORES_CABELO = [
  '#211824',
  '#65412E',
  '#B47B48',
  '#D8B56C',
  '#8B3DB7',
];

const AVATAR_INICIAL: Avatar = {
  modelo: 'menina',
  pele: 2,
  cabelo: 2,
  corCabelo: 0,
  roupa: 0,
  oculos: false,
  barba: false,
};

// ============================================
// AVATAR PERSONALIZADO
// ============================================

function AvatarVentrya({
  avatar,
  tamanho = 180,
}: {
  avatar: Avatar;
  tamanho?: number;
}) {
  const pele = PELES[avatar.pele] || PELES[2];
  const cabelo =
    CORES_CABELO[avatar.corCabelo] || CORES_CABELO[0];

  const penteado = avatar.cabelo;
  const menina = avatar.modelo !== 'menino';

  const formasCabelo = [
    'M61 92 Q50 27 110 26 Q170 26 159 92 L151 67 Q111 47 69 69 Z',
    'M58 91 Q46 24 110 22 Q178 21 164 93 L173 170 L148 170 L152 66 Q109 43 69 67 L71 170 L46 170 Z',
    'M55 95 Q42 31 96 25 Q134 12 162 46 Q175 73 162 99 Q176 120 160 151 L145 139 L154 69 Q112 43 67 70 L73 141 L56 152 Q43 123 55 95 Z',
    'M53 97 Q35 81 48 59 Q38 38 62 30 Q64 10 88 22 Q106 6 125 21 Q149 9 159 31 Q180 40 169 63 Q185 83 163 103 L151 66 Q110 43 68 68 Z',
    'M50 102 Q30 82 45 59 Q33 36 58 26 Q61 6 87 17 Q106 1 128 18 Q153 5 164 30 Q185 42 174 67 Q189 87 166 105 L153 67 Q109 43 66 69 Z',
  ];

  return (
    <Svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 220 230"
    >
      <Circle
        cx="110"
        cy="110"
        r="108"
        fill="#E4CDF9"
      />

      <Ellipse
        cx="110"
        cy="220"
        rx="76"
        ry="8"
        fill="#B56BFF"
        opacity={0.2}
      />

      <Path
        d="M27 230 Q30 169 85 160 L135 160 Q190 169 193 230 Z"
        fill={
          avatar.roupa === 0
            ? '#7735AF'
            : '#292D44'
        }
        stroke="#A874D2"
        strokeWidth={2}
      />

      {avatar.roupa === 0 ? (
        <>
          <Path
            d="M83 163 Q110 195 137 163"
            fill="none"
            stroke="#B887EA"
            strokeWidth={7}
          />
          <Path
            d="M106 193 L106 210 M114 193 L114 210"
            stroke="#D9B5FF"
            strokeWidth={2}
          />
        </>
      ) : (
        <>
          <Path
            d="M88 161 L110 195 L132 161"
            fill="#F1EAF7"
          />
          <Path
            d="M106 185 L110 218 L115 185 L110 177 Z"
            fill="#9B55DC"
          />
        </>
      )}

      <Rect
        x="96"
        y="139"
        width="28"
        height="35"
        rx="11"
        fill={pele}
      />

      <Ellipse
        cx="110"
        cy="97"
        rx={menina ? 50 : 54}
        ry={menina ? 65 : 63}
        fill={pele}
      />

      <Ellipse
        cx="78"
        cy="119"
        rx="11"
        ry="6"
        fill="#E98DA4"
        opacity={menina ? 0.2 : 0.1}
      />

      <Ellipse
        cx="142"
        cy="119"
        rx="11"
        ry="6"
        fill="#E98DA4"
        opacity={menina ? 0.2 : 0.1}
      />

      <Path
        d={formasCabelo[penteado] || formasCabelo[0]}
        fill={cabelo}
      />

      {menina && penteado === 0 && (
        <Path
          d="M59 84 Q43 112 55 154 L75 155 L69 82 M160 84 Q177 115 165 155 L145 155 L151 82"
          fill={cabelo}
        />
      )}

      {!menina &&
        (penteado === 1 || penteado === 2) && (
          <Path
            d="M51 119 L57 145 L71 139 L69 94 M169 119 L163 145 L149 139 L151 94"
            fill={cabelo}
          />
        )}

      {(penteado === 3 || penteado === 4) && (
        <>
          {[60, 78, 96, 114, 132, 150, 165].map(
            (x, i) => (
              <Circle
                key={i}
                cx={x}
                cy={i % 2 === 0 ? 48 : 31}
                r={penteado === 4 ? 17 : 13}
                fill={cabelo}
              />
            )
          )}
        </>
      )}

      <Path
        d="M73 60 Q110 34 145 59"
        stroke="#FFFFFF"
        strokeWidth={3}
        opacity={0.12}
        fill="none"
        strokeLinecap="round"
      />

      {penteado === 1 && (
        <Path
          d="M66 79 Q76 117 62 146 M155 79 Q144 116 159 146"
          stroke="#FFFFFF"
          opacity={0.11}
          strokeWidth={3}
          fill="none"
        />
      )}

      {penteado === 2 && (
        <Path
          d="M62 83 Q52 111 66 131 M157 83 Q170 110 155 132"
          stroke="#FFFFFF"
          opacity={0.12}
          strokeWidth={3}
          fill="none"
        />
      )}

      {(penteado === 3 || penteado === 4) && (
        <Path
          d="M61 49 Q73 35 86 39 M126 34 Q142 28 152 44"
          stroke="#FFFFFF"
          opacity={0.14}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      )}

      <Path
        d="M78 92 Q90 87 100 92 M120 92 Q131 87 142 92"
        stroke={cabelo}
        strokeWidth={3}
        fill="none"
      />

      <Ellipse
        cx="90"
        cy="101"
        rx={menina ? 4.5 : 4}
        ry={menina ? 5.5 : 5}
        fill="#251C2D"
      />

      <Ellipse
        cx="130"
        cy="101"
        rx={menina ? 4.5 : 4}
        ry={menina ? 5.5 : 5}
        fill="#251C2D"
      />

      <Circle
        cx="91"
        cy="99"
        r="1.5"
        fill="#FFFFFF"
      />

      <Circle
        cx="131"
        cy="99"
        r="1.5"
        fill="#FFFFFF"
      />

      {menina && (
        <Path
          d="M84 97 L80 93 M136 97 L140 93"
          stroke="#251C2D"
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}

      <Path
        d="M110 105 L105 119 Q110 123 115 119"
        fill="none"
        stroke="#714E49"
        strokeWidth={2}
        opacity={0.55}
      />

      {avatar.barba ? (
        <>
          <Path
            d="M68 118 Q72 159 110 168 Q148 159 152 118 Q141 144 130 148 Q110 157 90 148 Q78 143 68 118 Z"
            fill={cabelo}
          />
          <Path
            d="M94 131 Q110 124 126 131"
            stroke={cabelo}
            strokeWidth={6}
            fill="none"
          />
        </>
      ) : (
        <Path
          d="M97 135 Q110 143 123 135"
          stroke="#8D4C5B"
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
      )}

      {avatar.oculos && (
        <>
          <Rect
            x="72"
            y="89"
            width="33"
            height="25"
            rx="8"
            fill="none"
            stroke="#E6D6FF"
            strokeWidth={3}
          />
          <Rect
            x="115"
            y="89"
            width="33"
            height="25"
            rx="8"
            fill="none"
            stroke="#E6D6FF"
            strokeWidth={3}
          />
          <Path
            d="M105 96 Q110 92 115 96 M72 96 L59 91 M148 96 L161 91"
            stroke="#E6D6FF"
            strokeWidth={3}
            fill="none"
          />
        </>
      )}
    </Svg>
  );
}

// ============================================
// ARMAZENAMENTO DA SESSÃO
// ============================================

async function getSessionItem(
  key: string
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined'
      ? null
      : window.sessionStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function getLocalItem(
  key: string
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function removeSessionItem(key: string) {
  if (Platform.OS === 'web') {
    window.sessionStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

// ============================================
// API E PAGINAÇÃO
// ============================================

async function buscarTodasPaginas<T>(
  endpoint: string,
  jwt: string
): Promise<T[]> {
  const lista: T[] = [];

  for (let pagina = 0; pagina < 100; pagina++) {
    const { data } = await api.get<Page<T>>(
      endpoint,
      {
        params: {
          page: pagina,
          size: 50,
        },
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    if (!data || !Array.isArray(data.content)) {
      throw new Error(
        'Resposta de paginação inválida.'
      );
    }

    lista.push(...data.content);

    if (
      data.last === true ||
      data.content.length === 0 ||
      (
        Number.isFinite(data.totalPages) &&
        pagina + 1 >= data.totalPages
      )
    ) {
      return lista;
    }
  }

  throw new Error(
    'Limite de páginas da API atingido.'
  );
}

// ============================================
// TRADUÇÃO DE INFORMAÇÕES
// ============================================

const areaLabels: Record<string, string> = {
  TECHNOLOGY: 'Tecnologia',
  ADMINISTRATION: 'Administração',
  MARKETING: 'Marketing',
  DESIGN: 'Design',
  FINANCE: 'Finanças',
  OTHER: 'Outros',
};

const difficultyLabels: Record<string, string> = {
  EASY: 'Fácil',
  BEGINNER: 'Iniciante',
  MEDIUM: 'Intermediário',
  INTERMEDIATE: 'Intermediário',
  HARD: 'Avançado',
  ADVANCED: 'Avançado',
};

function formatarData(valor: string | null) {
  if (
    !valor ||
    !/^\d{4}-\d{2}-\d{2}/.test(valor)
  ) {
    return 'Não informado';
  }

  return (
    `${valor.slice(8, 10)}/` +
    `${valor.slice(5, 7)}/` +
    `${valor.slice(0, 4)}`
  );
}

function rotuloStatus(
  status: Status | undefined
) {
  if (status === 'APPROVED') {
    return 'Inscrição aprovada';
  }

  if (status === 'PENDING') {
    return 'Inscrição em análise';
  }

  if (status === 'REJECTED') {
    return 'Inscrição não aprovada';
  }

  return 'Inscrições abertas';
}

// ============================================
// GRÁFICO CIRCULAR
// ============================================

function ProgressCircle({
  value,
}: {
  value: number;
}) {
  const percentual = Math.min(
    100,
    Math.max(0, value)
  );

  const circunferencia =
    2 * Math.PI * 48;

  return (
    <View
      style={styles.circleWrap}
      accessibilityLabel={
        `${percentual}% das candidaturas aprovadas`
      }
    >
      <Svg
        width={136}
        height={136}
        viewBox="0 0 136 136"
      >
        <Circle
          cx="68"
          cy="68"
          r="48"
          stroke="#50305D"
          strokeWidth="12"
          fill="none"
        />

        <Circle
          cx="68"
          cy="68"
          r="48"
          stroke={C.roxo}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={
            `${circunferencia} ${circunferencia}`
          }
          strokeDashoffset={
            circunferencia *
            (1 - percentual / 100)
          }
          transform="rotate(-90 68 68)"
        />
      </Svg>

      <View
        style={styles.circleCenter}
        pointerEvents="none"
      >
        <Text style={styles.circleNumber}>
          {percentual}%
        </Text>
        <Text style={styles.circleCaption}>
          aprovação
        </Text>
      </View>
    </View>
  );
}

// ============================================
// CARTÕES DE INDICADORES
// ============================================

type StatProps = {
  numero: number;
  legenda: string;
  icone: React.ComponentProps<
    typeof Ionicons
  >['name'];
  cor: string;
};

function StatCard({
  numero,
  legenda,
  icone,
  cor,
}: StatProps) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: `${cor}1C`,
          },
        ]}
      >
        <Ionicons
          name={icone}
          size={21}
          color={cor}
        />
      </View>

      <Text style={styles.statNumber}>
        {numero}
      </Text>

      <Text style={styles.statLabel}>
        {legenda}
      </Text>
    </View>
  );
}

// ============================================
// TELA PRINCIPAL
// ============================================

export default function PainelScreen() {
const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const posicaoDesafios = useRef(0);
  const jaCarregouRef = useRef(false);

  const [nome, setNome] =
    useState('Estudante');

  const [avatarSalvo, setAvatarSalvo] =
    useState<Avatar | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [verificando, setVerificando] =
    useState(true);

  const [carregando, setCarregando] =
    useState(false);

  const [atualizando, setAtualizando] =
    useState(false);

  const [jaCarregou, setJaCarregou] =
    useState(false);

  const [erro, setErro] =
    useState('');

  const [applications, setApplications] =
    useState<Application[]>([]);

  const [challenges, setChallenges] =
    useState<Challenge[]>([]);

  const [desafioAberto, setDesafioAberto] =
    useState<number | null>(null);

  const [mostrarTodos, setMostrarTodos] =
    useState(false);

  // ==========================================
  // SAIR DA CONTA
  // ==========================================

  const encerrarSessao = useCallback(
    async () => {
      await removeSessionItem(
        'ventrya_token'
      );

      await removeSessionItem(
        'ventrya_user'
      );

      router.replace('/login');
    },
    []
  );

  // ==========================================
  // ATUALIZAR PERFIL
  // ==========================================

  const atualizarPerfil = useCallback(
    async () => {
      try {
        const dados = await getSessionItem(
          'ventrya_user'
        );

        if (!dados) return;

        const usuario = JSON.parse(dados);

        const chave = String(
          usuario.id ||
          usuario.email ||
          usuario.name ||
          'usuario'
        );

        const salvo = await getLocalItem(
          `ventrya_perfil_${chave}`
        );

        const perfil = salvo
          ? JSON.parse(salvo)
          : null;

        setNome(
          perfil?.nome ||
          usuario.name ||
          'Estudante'
        );

        setAvatarSalvo(
          perfil?.avatar
            ? {
                ...AVATAR_INICIAL,
                ...perfil.avatar,
              }
            : null
        );
      } catch {
        // Falhas no avatar não bloqueiam o painel.
      }
    },
    []
  );

  // ==========================================
  // CARREGAR INFORMAÇÕES REAIS
  // ==========================================

  const carregarDados = useCallback(
    async (
      jwt: string,
      refresh = false
    ) => {
      if (refresh) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro('');

      try {
        const [
          minhasCandidaturas,
          desafiosDisponiveis,
        ] = await Promise.all([
          buscarTodasPaginas<Application>(
            '/api/applications/me',
            jwt
          ),
          buscarTodasPaginas<Challenge>(
            '/api/challenges',
            jwt
          ),
        ]);

        setApplications(
          minhasCandidaturas
        );

        setChallenges(
          desafiosDisponiveis
        );

        setJaCarregou(true);
        jaCarregouRef.current = true;

      } catch (e: unknown) {
        if (
          axios.isAxiosError(e) &&
          e.response?.status === 401
        ) {
          await encerrarSessao();
          return;
        }

        setErro(
          'Não foi possível atualizar os dados. ' +
          'Verifique sua conexão e tente novamente.'
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [encerrarSessao]
  );

  // ==========================================
  // INICIAR O PAINEL
  // ==========================================

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      try {
        const [jwt, dados] =
          await Promise.all([
            getSessionItem(
              'ventrya_token'
            ),
            getSessionItem(
              'ventrya_user'
            ),
          ]);

        if (!jwt || !dados) {
          router.replace('/login');
          return;
        }

        const usuario =
          JSON.parse(dados);

        if (!ativo) return;

        setNome(
          usuario.name || 'Estudante'
        );

        setToken(jwt);
      } catch {
        if (ativo) {
          router.replace('/login');
        }
      } finally {
        if (ativo) {
          setVerificando(false);
        }
      }
    }

    void iniciar();

    return () => {
      ativo = false;
    };
  }, []);

  // Atualizar ao retornar ao painel.

  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      void atualizarPerfil();

      void carregarDados(
        token,
        jaCarregouRef.current
      );
    }, [
      token,
      atualizarPerfil,
      carregarDados,
    ])
  );

  // ==========================================
  // ESTATÍSTICAS
  // ==========================================

  const primeiroNome =
    nome.trim().split(/\s+/)[0] ||
    'Estudante';

  const aprovadas = applications.filter(
    item => item.status === 'APPROVED'
  ).length;

  const pendentes = applications.filter(
    item => item.status === 'PENDING'
  ).length;

  const rejeitadas = applications.filter(
    item => item.status === 'REJECTED'
  ).length;

  const total = applications.length;

  const percentual = total
    ? Math.round(
        (aprovadas * 100) / total
      )
    : 0;

  // ==========================================
  // DESAFIOS ABERTOS
  // ==========================================

  const desafiosAbertos = useMemo(
    () =>
      [...challenges]
        .filter(item =>
          ['OPEN', 'ACTIVE'].includes(
            (
              item.status || ''
            ).toUpperCase()
          )
        )
        .sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;

          return a.deadline.localeCompare(
            b.deadline
          );
        }),
    [challenges]
  );

  const desafiosVisiveis =
    mostrarTodos
      ? desafiosAbertos
      : desafiosAbertos.slice(0, 3);

  // Identificar candidaturas ligadas a desafios.

  const minhasInscricoes = useMemo(() => {
    const mapa =
      new Map<number, Application>();

    applications.forEach(item => {
      const anterior = mapa.get(
        item.challengeId
      );

      if (
        !anterior ||
        (
          item.status === 'APPROVED' &&
          anterior.status !== 'APPROVED'
        )
      ) {
        mapa.set(
          item.challengeId,
          item
        );
      }
    });

    return mapa;
  }, [applications]);

  // ==========================================
  // TELA DE CARREGAMENTO
  // ==========================================

  if (verificando) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={C.roxo}
        />
        <Text style={styles.muted}>
          Abrindo Ventrya...
        </Text>
      </View>
    );
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <LinearGradient
      colors={[
        '#090410',
        '#15071F',
        '#1B0A2B',
      ]}
      style={styles.screen}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              if (token) {
                void carregarDados(
                  token,
                  true
                );
              }
            }}
            tintColor={C.roxo}
          />
        }
      >
        <View style={styles.wrapper}>

          {/* CABEÇALHO E AVATAR */}

          <LinearGradient
            colors={[
              '#432054',
              '#2A123E',
              '#1D0F2D',
            ]}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View style={styles.eyebrowRow}>
                <Ionicons
                  name="sparkles"
                  size={15}
                  color={C.roxoClaro}
                />
                <Text style={styles.eyebrow}>
                  SEU UNIVERSO VENTRYA
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (token) {
                    void carregarDados(
                      token,
                      true
                    );
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Atualizar painel"
                style={styles.refreshButton}
                disabled={atualizando}
              >
                {atualizando ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                    size="small"
                  />
                ) : (
                  <Ionicons
                    name="refresh"
                    color="#F4D7FF"
                    size={19}
                  />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.heroMain}>
              <TouchableOpacity
                style={styles.avatar}
                onPress={() =>
                  router.push('/perfil')
                }
                accessibilityLabel="Abrir meu personagem"
                activeOpacity={0.85}
              >
                {avatarSalvo ? (
                  <AvatarVentrya
                    avatar={avatarSalvo}
                    tamanho={91}
                  />
                ) : (
                  <Ionicons
                    name="person"
                    size={36}
                    color="#E5B3FF"
                  />
                )}
              </TouchableOpacity>

              <View style={styles.heroText}>
                <Text style={styles.greeting}>
                  Olá, {primeiroNome}!
                </Text>

                <Text style={styles.heroSub}>
                  Seu próximo passo começa aqui.
                </Text>

                <TouchableOpacity
                  style={styles.profileLink}
                  onPress={() =>
                    router.push('/perfil')
                  }
                  accessibilityRole="button"
                >
                  <Text style={styles.profileLinkText}>
                    Meu perfil
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={C.roxoClaro}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* INTRODUÇÃO */}

          <View style={styles.intro}>
            <View style={styles.eyebrowRow}>
              <Ionicons
                name="sparkles"
                color={C.roxo}
                size={16}
              />

              <Text style={styles.introLabel}>
                SEU ESPAÇO DE EVOLUÇÃO
              </Text>
            </View>

            <Text style={styles.title}>
              Seu futuro começa com cada desafio.
            </Text>

            <Text style={styles.subtitle}>
              Construa sua experiência, mostre suas
              habilidades e acompanhe sua jornada
              profissional.
            </Text>

            <TouchableOpacity
              style={styles.introLink}
              onPress={() =>
                scrollRef.current?.scrollTo({
                  y:
                    posicaoDesafios.current +
                    26,
                  animated: true,
                })
              }
              accessibilityRole="button"
            >
              <Text style={styles.introLinkText}>
                Explorar desafios
              </Text>

              <Ionicons
                name="arrow-down"
                size={16}
                color={C.roxoClaro}
              />
            </TouchableOpacity>
          </View>

          {/* MENSAGEM DE ERRO AMIGÁVEL */}

          {!!erro && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color={C.vermelho}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.errorTitle}>
                  Não foi possível atualizar
                </Text>

                <Text style={styles.errorText}>
                  {erro}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    if (token) {
                      void carregarDados(token);
                    }
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.retryText}>
                    Tentar novamente
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* EVOLUÇÃO DAS CANDIDATURAS */}

          <LinearGradient
            colors={[
              '#381445',
              '#291234',
              '#21102D',
            ]}
            style={styles.evolutionCard}
          >
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.cardEyebrow}>
                  SEU DESEMPENHO
                </Text>

                <Text style={styles.cardTitle}>
                  Sua evolução
                </Text>
              </View>

              <View style={styles.trendIcon}>
                <Ionicons
                  name="trending-up"
                  color={C.roxoClaro}
                  size={22}
                />
              </View>
            </View>

            <View style={styles.evolutionBody}>
              <ProgressCircle
                value={percentual}
              />

              <View style={styles.evolutionInfo}>
                <Text style={styles.evolutionLabel}>
                  Taxa de aprovação
                </Text>

                <Text style={styles.evolutionValue}>
                  {aprovadas} de {total}
                </Text>

                <Text
                  style={
                    styles.evolutionDescription
                  }
                >
                  candidaturas aprovadas
                </Text>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width:
                          `${percentual}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.cardNoteRow}>
              <Ionicons
                name="information-circle-outline"
                color="#BBA6CB"
                size={16}
              />

              <Text style={styles.cardFootnote}>
                Indicador calculado apenas com as
                candidaturas. Não representa a
                quantidade de projetos entregues.
              </Text>
            </View>
          </LinearGradient>

          {/* INDICADORES */}

          <View style={styles.statsRow}>
            <StatCard
              numero={aprovadas}
              legenda="Aprovadas"
              icone="checkmark-circle-outline"
              cor={C.verde}
            />

            <StatCard
              numero={pendentes}
              legenda="Pendentes"
              icone="time-outline"
              cor={C.amarelo}
            />

            <StatCard
              numero={rejeitadas}
              legenda="Rejeitadas"
              icone="close-circle-outline"
              cor={C.vermelho}
            />
          </View>

          {/* ACOMPANHAMENTO */}

          <View style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons
                name="document-text-outline"
                color={C.roxoClaro}
                size={25}
              />
            </View>

            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>
                Acompanhe sua jornada
              </Text>

              <Text
                style={styles.actionDescription}
              >
                Confira suas candidaturas,
                entregas e avaliações em um só lugar.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionArrow}
              onPress={() =>
                router.push('/avaliacoes')
              }
              accessibilityLabel="Ir para avaliações"
              accessibilityRole="button"
            >
              <Ionicons
                name="arrow-forward"
                color="#FFFFFF"
                size={19}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push('/avaliacoes')
            }
            accessibilityRole="button"
          >
            <Ionicons
              name="analytics-outline"
              color="#FFFFFF"
              size={18}
            />

            <Text style={styles.primaryButtonText}>
              Ver candidaturas e avaliações
            </Text>

            <Ionicons
              name="arrow-forward"
              color="#FFFFFF"
              size={16}
            />
          </TouchableOpacity>

          {/* PRÓXIMOS DESAFIOS */}

          <View
            style={styles.challengesSection}
            onLayout={e => {
              posicaoDesafios.current =
                e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  Próximos desafios
                </Text>

                <Text
                  style={styles.sectionSubtitle}
                >
                  Explore oportunidades para praticar
                </Text>
              </View>

              <Text style={styles.sectionCount}>
                {desafiosAbertos.length} abertos
              </Text>
            </View>

            {carregando && !jaCarregou ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator
                  color={C.roxo}
                />

                <Text style={styles.muted}>
                  Buscando desafios...
                </Text>
              </View>

            ) : desafiosAbertos.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="rocket-outline"
                  size={31}
                  color={C.roxoClaro}
                />

                <Text style={styles.emptyTitle}>
                  Nenhum desafio aberto agora
                </Text>

                <Text style={styles.mutedCenter}>
                  Novos desafios aparecerão aqui
                  quando estiverem disponíveis.
                </Text>
              </View>

            ) : (
              desafiosVisiveis.map(desafio => {
                const expandido =
                  desafioAberto === desafio.id;

                const candidatura =
                  minhasInscricoes.get(desafio.id);

                return (
                  <View
                    key={desafio.id}
                    style={styles.challengeCard}
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={
                        `${desafio.title}. ` +
                        (
                          expandido
                            ? 'Recolher'
                            : 'Expandir'
                        ) +
                        ' detalhes'
                      }
                      onPress={() =>
                        setDesafioAberto(
                          expandido
                            ? null
                            : desafio.id
                        )
                      }
                    >
                      <View
                        style={styles.challengeTop}
                      >
                        <View
                          style={styles.challengeIcon}
                        >
                          <Ionicons
                            name="code-slash"
                            size={23}
                            color={C.roxoClaro}
                          />
                        </View>

                        <View
                          style={
                            styles.challengeContent
                          }
                        >
                          <Text
                            style={
                              styles.challengeTitle
                            }
                          >
                            {desafio.title}
                          </Text>

                          <Text
                            style={
                              styles.challengeDescription
                            }
                            numberOfLines={
                              expandido
                                ? undefined
                                : 2
                            }
                          >
                            {desafio.description ||
                              'Saiba mais sobre este desafio.'}
                          </Text>
                        </View>

                        <Ionicons
                          name={
                            expandido
                              ? 'chevron-up'
                              : 'chevron-down'
                          }
                          size={19}
                          color={C.roxoClaro}
                        />
                      </View>

                      <View
                        style={styles.challengeMeta}
                      >
                        <Text style={styles.metaPill}>
                          {areaLabels[
                            desafio.professionalArea
                          ] ||
                            desafio.professionalArea ||
                            'Outra área'}
                        </Text>

                        <Text style={styles.metaPill}>
                          {difficultyLabels[
                            desafio.difficulty
                          ] ||
                            desafio.difficulty ||
                            'Nível não informado'}
                        </Text>
                      </View>

                      <View
                        style={styles.deadlineRow}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={15}
                          color="#C8A1DC"
                        />

                        <Text
                          style={styles.deadlineText}
                        >
                          Prazo: {
                            formatarData(
                              desafio.deadline
                            )
                          }
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* INFORMAÇÕES EXPANDIDAS */}

                    {expandido && (
                      <View
                        style={styles.expandedArea}
                      >
                        {!!desafio.organizationName && (
                          <>
                            <Text
                              style={
                                styles.expandedLabel
                              }
                            >
                              Organização
                            </Text>

                            <Text
                              style={
                                styles.expandedText
                              }
                            >
                              {
                                desafio.organizationName
                              }
                            </Text>
                          </>
                        )}

                        <Text
                          style={styles.expandedLabel}
                        >
                          Requisitos
                        </Text>

                        <Text
                          style={styles.expandedText}
                        >
                          {desafio.requirements ||
                            'Nenhum requisito adicional informado.'}
                        </Text>

                        <View
                          style={styles.statusPill}
                        >
                          <Ionicons
                            name="information-circle-outline"
                            size={15}
                            color={C.roxoClaro}
                          />

                          <Text
                            style={
                              styles.statusPillText
                            }
                          >
                            {
                              rotuloStatus(
                                candidatura?.status
                              )
                            }
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={
                            styles.challengeButton
                          }
                          accessibilityRole="button"
                          onPress={() =>
                            router.push({
                              pathname:
                                '/desafios/[id]',
                              params: {
                                id: String(
                                  desafio.id
                                ),
                              },
                            })
                          }
                        >
                          <Text
                            style={
                              styles.challengeButtonText
                            }
                          >
                            Abrir desafio
                          </Text>

                          <Ionicons
                            name="arrow-forward"
                            color="#FFFFFF"
                            size={17}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {/* MOSTRAR MAIS DESAFIOS */}

            {desafiosAbertos.length > 3 && (
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() =>
                  setMostrarTodos(v => !v)
                }
                accessibilityRole="button"
              >
                <Text
                  style={styles.outlineText}
                >
                  {mostrarTodos
                    ? 'Mostrar menos'
                    : `Ver todos os ${desafiosAbertos.length} desafios abertos`}
                </Text>

                <Ionicons
                  name={
                    mostrarTodos
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={17}
                  color={C.roxoClaro}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* MENSAGEM DE INCENTIVO */}

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="bulb-outline"
                size={24}
                color={C.roxoClaro}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={styles.summaryTitle}
              >
                Continue evoluindo!
              </Text>

              <Text
                style={styles.summaryText}
              >
                Seu currículo mostra o que você sabe.
                Seus desafios ajudam a mostrar o que
                você consegue fazer.
              </Text>
            </View>
          </View>

          {/* SAIR */}

          <TouchableOpacity
            style={styles.logout}
            onPress={() =>
              void encerrarSessao()
            }
            accessibilityRole="button"
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color={C.roxoClaro}
            />

            <Text
              style={styles.logoutText}
            >
              Sair da conta
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            VENTRYA  •  GLOBAL SOLUTION 2026
          </Text>

        </View>
      </ScrollView>

      <BottomNav />
    </LinearGradient>
  );
}

// ============================================
// ESTILOS DO PAINEL
// ============================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: C.fundo,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  muted: {
    color: C.suave,
    fontSize: 12,
    lineHeight: 19,
  },

  mutedCenter: {
    color: C.suave,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 38,
    alignItems: 'center',
  },

  wrapper: {
    width: '100%',
    maxWidth: 650,
  },

  hero: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#75408E',
    borderRadius: 23,
    marginBottom: 28,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  eyebrow: {
    color: C.roxoClaro,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  refreshButton: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: '#513064',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroMain: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },

  avatar: {
    width: 95,
    height: 95,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: '#DCC4F5',
    borderWidth: 2,
    borderColor: C.roxo,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroText: {
    flex: 1,
    gap: 6,
  },

  greeting: {
    fontSize: 21,
    fontWeight: '800',
    color: C.texto,
  },

  heroSub: {
    color: '#DEC5E8',
    fontSize: 12,
    lineHeight: 18,
  },

  profileLink: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: 5,
    alignSelf: 'flex-start',
  },

  profileLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.roxoClaro,
  },

  intro: {
    marginBottom: 24,
    gap: 10,
  },

  introLabel: {
    color: '#DC9BFF',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
  },

  title: {
    color: C.texto,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: C.suave,
    fontSize: 13,
    lineHeight: 21,
  },

  introLink: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
  },

  introLinkText: {
    color: C.roxoClaro,
    fontSize: 12,
    fontWeight: '800',
  },

  errorBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#361A2B',
    borderWidth: 1,
    borderColor: '#694257',
    borderRadius: 15,
    padding: 15,
    marginBottom: 18,
  },

  errorTitle: {
    color: '#FFD7DE',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },

  errorText: {
    color: '#F5B7C1',
    fontSize: 12,
    lineHeight: 19,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
    textDecorationLine: 'underline',
  },

  evolutionCard: {
    padding: 19,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#77418D',
    marginBottom: 13,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },

  cardEyebrow: {
    color: '#BD8BD0',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginBottom: 6,
  },

  cardTitle: {
    color: C.texto,
    fontSize: 20,
    fontWeight: '900',
  },

  trendIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#513063',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  evolutionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  circleWrap: {
    width: 136,
    height: 136,
    justifyContent: 'center',
    alignItems: 'center',
  },

  circleCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },

  circleNumber: {
    color: C.texto,
    fontWeight: '900',
    fontSize: 27,
  },

  circleCaption: {
    color: '#D6B9E4',
    fontSize: 10,
  },

  evolutionInfo: {
    flex: 1,
    gap: 6,
  },

  evolutionLabel: {
    color: '#D8BDE6',
    fontSize: 12,
  },

  evolutionValue: {
    color: C.texto,
    fontSize: 27,
    fontWeight: '900',
  },

  evolutionDescription: {
    color: '#D2B6DF',
    fontSize: 11,
  },

  progressTrack: {
    height: 7,
    borderRadius: 8,
    backgroundColor: '#553163',
    overflow: 'hidden',
    marginTop: 9,
  },

  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: C.roxo,
  },

  cardNoteRow: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'flex-start',
    marginTop: 15,
  },

  cardFootnote: {
    flex: 1,
    color: '#BAA4C8',
    fontSize: 10,
    lineHeight: 16,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 19,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#251431',
    paddingVertical: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#533365',
    borderRadius: 16,
    gap: 7,
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statNumber: {
    color: C.texto,
    fontSize: 26,
    fontWeight: '900',
  },

  statLabel: {
    color: '#D7C4E0',
    fontSize: 11,
    textAlign: 'center',
  },

  actionCard: {
    backgroundColor: '#261431',
    borderWidth: 1,
    borderColor: '#654080',
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#45225D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    color: C.texto,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },

  actionDescription: {
    color: C.suave,
    fontSize: 11,
    lineHeight: 17,
  },

  actionArrow: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#714091',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButton: {
    backgroundColor: '#8F31C4',
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 13,
    marginTop: 10,
    marginBottom: 34,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },

  challengesSection: {
    marginBottom: 15,
  },

  sectionTitle: {
    color: C.texto,
    fontSize: 19,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: C.suave,
    fontSize: 11,
    marginTop: 5,
  },

  sectionCount: {
    color: C.roxoClaro,
    fontSize: 12,
    fontWeight: '700',
  },

  challengeCard: {
    backgroundColor: '#251431',
    borderWidth: 1,
    borderColor: '#5B3970',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  challengeTop: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
  },

  challengeIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#4A2560',
    alignItems: 'center',
    justifyContent: 'center',
  },

  challengeContent: {
    flex: 1,
  },

  challengeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },

  challengeDescription: {
    color: C.suave,
    fontSize: 12,
    lineHeight: 18,
  },

  challengeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 14,
  },

  metaPill: {
    color: '#E6B7FF',
    backgroundColor: '#472158',
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
  },

  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 13,
  },

  deadlineText: {
    color: '#CDB5D9',
    fontSize: 11,
  },

  expandedArea: {
    borderTopWidth: 1,
    borderTopColor: '#58386B',
    marginTop: 15,
    paddingTop: 15,
    gap: 7,
  },

  expandedLabel: {
    color: C.roxoClaro,
    fontSize: 12,
    fontWeight: '800',
  },

  expandedText: {
    color: C.suave,
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 6,
  },

  statusPill: {
    backgroundColor: '#372047',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  statusPillText: {
    color: C.roxoClaro,
    fontSize: 11,
    fontWeight: '700',
  },

  challengeButton: {
    backgroundColor: '#8040A5',
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 13,
    gap: 8,
    marginTop: 8,
  },

  challengeButtonText: {
    color: C.texto,
    fontSize: 12,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.borda,
    padding: 25,
    gap: 10,
    alignItems: 'center',
  },

  emptyTitle: {
    color: C.texto,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: '#75428B',
    padding: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },

  outlineText: {
    color: C.roxoClaro,
    fontWeight: '800',
    fontSize: 12,
  },

  summaryCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 17,
    backgroundColor: '#2A1639',
    borderWidth: 1,
    borderColor: '#5C3970',
    borderRadius: 18,
    marginTop: 10,
  },

  summaryIcon: {
    width: 41,
    height: 41,
    backgroundColor: '#46255B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 6,
  },

  summaryText: {
    color: C.suave,
    fontSize: 12,
    lineHeight: 19,
  },

  logout: {
    borderWidth: 1,
    borderColor: '#76418B',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 13,
    marginTop: 28,
  },

  logoutText: {
    color: C.roxoClaro,
    fontSize: 13,
    fontWeight: '800',
  },

  footer: {
    color: '#9981A8',
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 26,
  },
});
