
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

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
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import Svg, {
  Circle,
  Ellipse,
  Path,
  Rect,
} from 'react-native-svg';

import BottomNav from '../components/BottomNav';
import CurriculoOriginal from '../components/CurriculoOriginal';

import {
  carregarPontuacoes,
  obterUsuarioArena,
  totalRecordes,
} from '../services/arenaStorage';

import type {
  PontuacoesArena,
} from '../services/arenaStorage';

// ============================================
// TIPOS
// ============================================

type Avatar = {
  modelo: 'menina' | 'menino';
  pele: number;
  cabelo: number;
  corCabelo: number;
  roupa: number;
  oculos: boolean;
  barba: boolean;
};

type Perfil = {
  nome: string;
  email: string;
  telefone: string;
  github: string;
  cargo: string;
  sobre: string;
  experiencia: string;
  formacao: string;
  habilidades: string;
  avatar: Avatar | null;
};

// ============================================
// CORES E PERSONALIZAÇÃO
// ============================================

const PELES = [
  '#F5D8C1',
  '#E7BA98',
  '#C98D64',
  '#A96B48',
  '#78462F',
  '#442A24',
];

const CABELOS = [
  'Curto',
  'Liso',
  'Ondulado',
  'Cacheado',
  'Crespo',
];

const CORES_CABELO = [
  '#211824',
  '#65412E',
  '#B47B48',
  '#D8B56C',
  '#8B3DB7',
];

const ROUPAS = [
  'Moletom Ventrya',
  'Social',
];

// Este avatar é usado somente como prévia
// durante a criação, não como avatar de uma
// conta que acabou de ser cadastrada.

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
// DESENHO DO PERSONAGEM
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
    CORES_CABELO[avatar.corCabelo] ||
    CORES_CABELO[0];

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
        d={
          formasCabelo[penteado] ||
          formasCabelo[0]
        }
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
// ARMAZENAMENTO
// ============================================

async function lerLocal(
  chave: string
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(chave);
  }

  return SecureStore.getItemAsync(chave);
}

async function salvarLocal(
  chave: string,
  valor: string
): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(chave, valor);
  } else {
    await SecureStore.setItemAsync(
      chave,
      valor
    );
  }
}

async function lerSessao(
  chave: string
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return window.sessionStorage.getItem(chave);
  }

  return SecureStore.getItemAsync(chave);
}

// ============================================
// CAMPO DE CURRÍCULO
// ============================================

function Campo({
  titulo,
  valor,
  alterar,
  placeholder,
  multiline = false,
  teclado,
}: {
  titulo: string;
  valor: string;
  alterar: (texto: string) => void;
  placeholder?: string;
  multiline?: boolean;
  teclado?: 'email-address' | 'phone-pad' | 'url';
}) {
  return (
    <View style={styles.campoGrupo}>
      <Text style={styles.campoTitulo}>
        {titulo}
      </Text>

      <TextInput
        style={[
          styles.input,
          multiline && styles.inputGrande,
        ]}
        value={valor}
        onChangeText={alterar}
        placeholder={placeholder}
        placeholderTextColor="#8F7B9D"
        multiline={multiline}
        textAlignVertical={
          multiline ? 'top' : 'center'
        }
        keyboardType={teclado || 'default'}
        autoCapitalize={
          teclado === 'email-address' ||
          teclado === 'url'
            ? 'none'
            : 'sentences'
        }
        accessibilityLabel={titulo}
      />
    </View>
  );
}

// ============================================
// COMPONENTE DE OPÇÃO
// ============================================

function Opcao({
  texto,
  selecionado,
  onPress,
}: {
  texto: string;
  selecionado: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.opcao,
        selecionado && styles.opcaoSelecionada,
      ]}
      accessibilityRole="button"
      accessibilityState={{
        selected: selecionado,
      }}
    >
      <Text
        style={[
          styles.opcaoTexto,
          selecionado &&
            styles.opcaoTextoSelecionada,
        ]}
      >
        {texto}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================
// TELA PRINCIPAL DO PERFIL
// ============================================

export default function PerfilScreen() {
  const [perfil, setPerfil] = useState<Perfil>({
    nome: '',
    email: '',
    telefone: '',
    github: '',
    cargo: '',
    sobre: '',
    experiencia: '',
    formacao: '',
    habilidades: '',
    avatar: null,
  });

  const [avatarRascunho, setAvatarRascunho] =
    useState<Avatar>({
      ...AVATAR_INICIAL,
    });

  const [chave, setChave] =
    useState<string | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [editandoAvatar, setEditandoAvatar] =
    useState(false);

  const [editandoCurriculo, setEditandoCurriculo] =
    useState(false);

  const [curriculoAntes, setCurriculoAntes] =
    useState<Omit<Perfil, 'avatar'> | null>(null);

  const [aviso, setAviso] =
    useState('');

  const [pontuacoes, setPontuacoes] =
    useState<PontuacoesArena>({});

  // ==========================================
  // ATUALIZAR PONTUAÇÕES DA ARENA
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregar() {
        try {
          const usuario =
            await obterUsuarioArena();

          if (!usuario) return;

          const dados =
            await carregarPontuacoes(
              usuario.id
            );

          if (ativo) {
            setPontuacoes(dados);
          }
        } catch {
          // Falhas nos recordes não
          // bloqueiam o perfil.
        }
      }

      void carregar();

      return () => {
        ativo = false;
      };
    }, [])
  );

  // ==========================================
  // CARREGAR PERFIL SALVO
  // ==========================================

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      try {
        const token =
          await lerSessao('ventrya_token');

        const usuarioTexto =
          await lerSessao('ventrya_user');

        if (!token || !usuarioTexto) {
          router.replace('/login');
          return;
        }

        const usuario =
          JSON.parse(usuarioTexto);

        const identificador = String(
          usuario.id ||
          usuario.email ||
          usuario.name ||
          'usuario'
        );

        const chavePerfil =
          `ventrya_perfil_${identificador}`;

        const salvo =
          await lerLocal(chavePerfil);

        const dadosSalvos = salvo
          ? JSON.parse(salvo)
          : {};

        if (!ativo) return;

        // Não cria um avatar automaticamente.
        // Recupera apenas o que foi salvo.

        const avatarAnterior: Avatar | null =
          dadosSalvos.avatar &&
          typeof dadosSalvos.avatar === 'object'
            ? {
                ...AVATAR_INICIAL,
                ...dadosSalvos.avatar,
              }
            : null;

        setChave(chavePerfil);

        setPerfil({
          nome: usuario.name || '',
          email: usuario.email || '',
          telefone: '',
          github: '',
          cargo: '',
          sobre: '',
          experiencia: '',
          formacao: '',
          habilidades: '',
          ...dadosSalvos,
          avatar: avatarAnterior,
        });

        setAvatarRascunho(
          avatarAnterior
            ? { ...avatarAnterior }
            : { ...AVATAR_INICIAL }
        );

      } catch {
        if (ativo) {
          setAviso(
            'Não foi possível carregar os dados salvos do perfil.'
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void iniciar();

    return () => {
      ativo = false;
    };
  }, []);

  // ==========================================
  // ATUALIZAR CURRÍCULO
  // ==========================================

  function atualizar(
    campo: keyof Omit<Perfil, 'avatar'>,
    valor: string
  ) {
    setPerfil(atual => ({ ...atual, [campo]: valor }));
    setAviso('');
  }

  function alternarEdicaoCurriculo() {
    if (editandoAvatar) {
      setAviso('Conclua ou feche a edição do avatar antes de editar o currículo.');
      return;
    }
    if (!editandoCurriculo) {
      const { avatar: _avatar, ...campos } = perfil;
      setCurriculoAntes(campos);
      setEditandoCurriculo(true);
    } else {
      if (curriculoAntes) {
        setPerfil(atual => ({ ...atual, ...curriculoAntes }));
      }
      setCurriculoAntes(null);
      setEditandoCurriculo(false);
    }
    setAviso('');
  }

  // ==========================================
  // ABRIR OU FECHAR CRIADOR DE AVATAR
  // ==========================================

  function alternarPersonalizacao() {
    if (editandoCurriculo) {
      setAviso('Salve ou cancele a edição do currículo antes de personalizar seu avatar.');
      return;
    }
    // Sempre inicia com os dados salvos.
    // Se não existe avatar, usa uma prévia.
    // Fechar sem salvar descarta o rascunho.

    setAvatarRascunho(
      perfil.avatar
        ? { ...perfil.avatar }
        : { ...AVATAR_INICIAL }
    );

    setEditandoAvatar(atual => !atual);
    setAviso('');
  }

  // ==========================================
  // PERSONALIZAR PRÉVIA DO AVATAR
  // ==========================================

  function atualizarAvatar(
    campo: keyof Avatar,
    valor:
      | number
      | boolean
      | 'menina'
      | 'menino'
  ) {
    setAvatarRascunho(atual => ({
      ...atual,
      [campo]: valor,
    }));

    setAviso('');
  }

  // ==========================================
  // SALVAR PERFIL E AVATAR
  // ==========================================

  async function salvar(tipo: 'avatar' | 'curriculo') {
    if (salvando) return;

    if (!chave) {
      setAviso(
        'Não foi possível identificar sua sessão. Entre novamente na conta.'
      );
      return;
    }

    if (!perfil.nome.trim()) {
      setAviso(
        'Informe seu nome antes de salvar.'
      );
      return;
    }

    setSalvando(true);

    try {
      // Só cria ou altera o avatar quando
      // o usuário está no criador.

      const perfilParaSalvar: Perfil =
        tipo === 'avatar' && editandoAvatar
          ? {
              ...perfil,
              avatar: {
                ...avatarRascunho,
              },
            }
          : perfil;

      await salvarLocal(
        chave,
        JSON.stringify(perfilParaSalvar)
      );

      setPerfil(perfilParaSalvar);
      if (tipo === 'avatar') setEditandoAvatar(false);
      if (tipo === 'curriculo') {
        setEditandoCurriculo(false);
        setCurriculoAntes(null);
      }

      const confirmacao = tipo === 'avatar'
        ? 'Avatar salvo neste dispositivo!'
        : 'Currículo resumido salvo neste dispositivo!';
      setAviso(confirmacao);

      if (Platform.OS !== 'web') Alert.alert('Ventrya', confirmacao);

    } catch {
      setAviso(
        'Não foi possível salvar. Tente novamente.'
      );
    } finally {
      setSalvando(false);
    }
  }

  // ==========================================
  // CARREGAMENTO
  // ==========================================

  if (carregando) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator
          size="large"
          color="#C85AFF"
        />

        <Text style={styles.subtitulo}>
          Carregando seu perfil...
        </Text>
      </View>
    );
  }

  // ==========================================
  // INTERFACE PRINCIPAL
  // ==========================================

  return (
    <LinearGradient
      colors={[
        '#08040E',
        '#12051F',
        '#1C082B',
      ]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.largura}>

          {/* CABEÇALHO */}

          <View style={styles.topo}>
            <View>
              <Text style={styles.selo}>
                SEU UNIVERSO VENTRYA
              </Text>

              <Text style={styles.titulo}>
                Meu Perfil
              </Text>

              <Text style={styles.subtitulo}>
                Sua identidade. Sua trajetória. Seu futuro.
              </Text>
            </View>

            <Ionicons
              name="sparkles"
              size={26}
              color="#D78AFF"
            />
          </View>

          {!!aviso && (
            <Text style={styles.aviso}>{aviso}</Text>
          )}

          {/* CARTÃO DO AVATAR */}

          <LinearGradient
            colors={[
              '#361348',
              '#23102F',
            ]}
            style={styles.cartaoDestaque}
          >

            {/* AVATAR CRIADO OU PRÉVIA */}

            {perfil.avatar || editandoAvatar ? (
              <View style={styles.avatarCirculo}>
                <AvatarVentrya
                  avatar={
                    editandoAvatar
                      ? avatarRascunho
                      : perfil.avatar!
                  }
                  tamanho={165}
                />
              </View>
            ) : (

              /* CONVITE PARA NOVOS USUÁRIOS */

              <View style={styles.conviteAvatar}>
                <View style={styles.conviteIcone}>
                  <Ionicons
                    name="sparkles"
                    size={35}
                    color="#E4B3FF"
                  />
                </View>

                <Text style={styles.conviteTitulo}>
                  Sua jornada começa aqui!
                </Text>

                <Text style={styles.conviteTexto}>
                  Crie seu avatar para começar essa
                  jornada e dar um rosto à sua
                  trajetória no Ventrya.
                </Text>
              </View>
            )}

            <Text style={styles.nome}>
              {perfil.nome || 'Estudante Ventrya'}
            </Text>

            <Text style={styles.cargo}>
              {perfil.cargo ||
                'Em busca de novas oportunidades'}
            </Text>

            <TouchableOpacity
              style={styles.botaoPrincipal}
              onPress={alternarPersonalizacao}
              accessibilityRole="button"
            >
              <Ionicons
                name="color-palette-outline"
                size={19}
                color="#FFFFFF"
              />

              <Text style={styles.botaoTexto}>
                {editandoAvatar
                  ? 'Fechar personalização'
                  : perfil.avatar
                    ? 'Editar meu avatar'
                    : 'Criar meu avatar'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.nota}>
              {editandoAvatar
                ? 'Personalize seu personagem e salve quando terminar.'
                : perfil.avatar
                  ? 'Seu avatar foi criado! Você pode editá-lo quando quiser.'
                  : 'Seu avatar ainda não foi criado. A escolha do modelo é livre e não define sua identidade de gênero.'}
            </Text>
          </LinearGradient>

          {/* CRIADOR DE PERSONAGEM */}

          {editandoAvatar && (
            <View style={styles.cartao}>
              <Text style={styles.secaoTitulo}>
                Criador de personagem
              </Text>

              <Text style={styles.secaoDescricao}>
                Personalize seu avatar. As mudanças
                aparecem acima em tempo real.
              </Text>

              <Text style={styles.etiqueta}>
                Modelo do personagem
              </Text>

              <View style={styles.linhaOpcoes}>
                <Opcao
                  texto="Menina"
                  selecionado={
                    avatarRascunho.modelo !==
                    'menino'
                  }
                  onPress={() =>
                    atualizarAvatar(
                      'modelo',
                      'menina'
                    )
                  }
                />

                <Opcao
                  texto="Menino"
                  selecionado={
                    avatarRascunho.modelo ===
                    'menino'
                  }
                  onPress={() =>
                    atualizarAvatar(
                      'modelo',
                      'menino'
                    )
                  }
                />
              </View>

              <Text style={styles.etiqueta}>
                Tom de pele
              </Text>

              <View style={styles.linhaOpcoes}>
                {PELES.map((cor, indice) => (
                  <TouchableOpacity
                    key={cor}
                    onPress={() =>
                      atualizarAvatar(
                        'pele',
                        indice
                      )
                    }
                    accessibilityLabel={
                      `Tom de pele ${indice + 1}`
                    }
                    accessibilityState={{
                      selected:
                        avatarRascunho.pele === indice,
                    }}
                    style={[
                      styles.amostraBorda,
                      avatarRascunho.pele === indice &&
                        styles.amostraAtiva,
                    ]}
                  >
                    <View
                      style={[
                        styles.amostra,
                        {
                          backgroundColor: cor,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.etiqueta}>
                Estilo de cabelo
              </Text>

              <View style={styles.linhaOpcoes}>
                {CABELOS.map((nome, indice) => (
                  <Opcao
                    key={nome}
                    texto={nome}
                    selecionado={
                      avatarRascunho.cabelo === indice
                    }
                    onPress={() =>
                      atualizarAvatar(
                        'cabelo',
                        indice
                      )
                    }
                  />
                ))}
              </View>

              <Text style={styles.etiqueta}>
                Cor do cabelo
              </Text>

              <View style={styles.linhaOpcoes}>
                {CORES_CABELO.map(
                  (cor, indice) => (
                    <TouchableOpacity
                      key={cor}
                      onPress={() =>
                        atualizarAvatar(
                          'corCabelo',
                          indice
                        )
                      }
                      accessibilityLabel={
                        `Cor de cabelo ${indice + 1}`
                      }
                      accessibilityState={{
                        selected:
                          avatarRascunho.corCabelo ===
                          indice,
                      }}
                      style={[
                        styles.amostraBorda,
                        avatarRascunho.corCabelo ===
                          indice &&
                          styles.amostraAtiva,
                      ]}
                    >
                      <View
                        style={[
                          styles.amostra,
                          {
                            backgroundColor: cor,
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  )
                )}
              </View>

              <Text style={styles.etiqueta}>
                Roupa
              </Text>

              <View style={styles.linhaOpcoes}>
                {ROUPAS.map((nome, indice) => (
                  <Opcao
                    key={nome}
                    texto={nome}
                    selecionado={
                      avatarRascunho.roupa === indice
                    }
                    onPress={() =>
                      atualizarAvatar(
                        'roupa',
                        indice
                      )
                    }
                  />
                ))}
              </View>

              <Text style={styles.etiqueta}>
                Acessórios
              </Text>

              <View style={styles.linhaOpcoes}>
                <Opcao
                  texto={
                    avatarRascunho.oculos
                      ? '✓ Com óculos'
                      : 'Sem óculos'
                  }
                  selecionado={
                    avatarRascunho.oculos
                  }
                  onPress={() =>
                    atualizarAvatar(
                      'oculos',
                      !avatarRascunho.oculos
                    )
                  }
                />

                <Opcao
                  texto={
                    avatarRascunho.barba
                      ? '✓ Com barba'
                      : 'Sem barba'
                  }
                  selecionado={
                    avatarRascunho.barba
                  }
                  onPress={() =>
                    atualizarAvatar(
                      'barba',
                      !avatarRascunho.barba
                    )
                  }
                />
              </View>

              {/* SALVAR AVATAR */}

              <TouchableOpacity
                style={[
                  styles.botaoPrincipal,
                  styles.botaoSalvarAvatar,
                ]}
                onPress={() => {
                  void salvar('avatar');
                }}
                disabled={salvando}
                accessibilityRole="button"
              >
                {salvando ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                )}

                <Text style={styles.botaoTexto}>
                  {salvando
                    ? 'Salvando avatar...'
                    : 'Concluir e salvar meu avatar'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* CURRÍCULO */}

          <View style={styles.cartao}>
            <View style={styles.cabecalhoSecao}>
              <View style={styles.tituloComIcone}>
                <Ionicons
                  name="briefcase-outline"
                  size={22}
                  color="#D78AFF"
                />

                <Text style={styles.secaoTitulo}>
                  Meu currículo
                </Text>
              </View>

              <TouchableOpacity
                onPress={alternarEdicaoCurriculo}
                accessibilityRole="button"
                accessibilityLabel={editandoCurriculo ? 'Cancelar edição' : 'Editar currículo'}
                style={styles.editarCurriculo}
              >
                <Ionicons
                  name={editandoCurriculo ? 'close-outline' : 'create-outline'}
                  size={18}
                  color="#E3A5FF"
                />
                <Text style={styles.editarTexto}>
                  {editandoCurriculo ? 'Cancelar' : 'Editar'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.secaoDescricao}>
              Um resumo profissional para apresentar
              suas habilidades e experiências.
            </Text>

            {editandoCurriculo ? (
              <View style={styles.formulario}>
                <Campo
                  titulo="Nome de exibição"
                  valor={perfil.nome}
                  alterar={v =>
                    atualizar('nome', v)
                  }
                />

                <Campo
                  titulo="E-mail"
                  valor={perfil.email}
                  alterar={v =>
                    atualizar('email', v)
                  }
                  teclado="email-address"
                />

                <Campo
                  titulo="Telefone (opcional)"
                  valor={perfil.telefone}
                  alterar={v =>
                    atualizar('telefone', v)
                  }
                  teclado="phone-pad"
                />

                <Campo
                  titulo="GitHub (opcional)"
                  valor={perfil.github}
                  alterar={v =>
                    atualizar('github', v)
                  }
                  placeholder="github.com/seu-usuario"
                  teclado="url"
                />

                <Campo
                  titulo="Cargo ou objetivo profissional"
                  valor={perfil.cargo}
                  alterar={v =>
                    atualizar('cargo', v)
                  }
                  placeholder="Ex.: Desenvolvedor(a) Júnior"
                />

                <Campo
                  titulo="Sobre mim"
                  valor={perfil.sobre}
                  alterar={v =>
                    atualizar('sobre', v)
                  }
                  multiline
                  placeholder="Conte brevemente sobre você..."
                />

                <Campo
                  titulo="Experiências anteriores"
                  valor={perfil.experiencia}
                  alterar={v =>
                    atualizar('experiencia', v)
                  }
                  multiline
                  placeholder="Empresa, função, período e atividades..."
                />

                <Campo
                  titulo="Formação acadêmica"
                  valor={perfil.formacao}
                  alterar={v =>
                    atualizar('formacao', v)
                  }
                  multiline
                  placeholder="Curso, instituição e período..."
                />

                <Campo
                  titulo="Habilidades"
                  valor={perfil.habilidades}
                  alterar={v =>
                    atualizar('habilidades', v)
                  }
                  placeholder="Java, React, SQL, Python..."
                />
              </View>
            ) : (
              <View style={styles.resumo}>
                <Text style={styles.resumoRotulo}>
                  E-mail
                </Text>
                <Text style={styles.resumoValor}>
                  {perfil.email || 'Não informado'}
                </Text>

                <Text style={styles.resumoRotulo}>
                  Telefone
                </Text>
                <Text style={styles.resumoValor}>
                  {perfil.telefone || 'Não informado'}
                </Text>

                <Text style={styles.resumoRotulo}>
                  GitHub
                </Text>
                <Text style={styles.resumoValor}>
                  {perfil.github || 'Não informado'}
                </Text>

                <Text style={styles.resumoRotulo}>
                  Sobre mim
                </Text>
                <Text style={styles.resumoValor}>
                  {perfil.sobre ||
                    'Adicione um resumo profissional.'}
                </Text>

                <Text style={styles.resumoRotulo}>
                  Experiência
                </Text>
                <Text style={styles.resumoValor}>
                  {perfil.experiencia ||
                    'Adicione suas experiências anteriores.'}
                </Text>

                <Text style={styles.resumoRotulo}>
                  Formação
                </Text>
                <Text style={styles.resumoValor}>
                  {perfil.formacao ||
                    'Adicione sua formação acadêmica.'}
                </Text>

                <Text style={styles.resumoRotulo}>
                  Habilidades
                </Text>
                <Text style={styles.resumoValor}>
                  {perfil.habilidades ||
                    'Adicione suas habilidades.'}
                </Text>
              </View>
            )}

            {editandoCurriculo && (
              <TouchableOpacity
                style={[styles.salvar, salvando && { opacity: 0.6 }]}
                onPress={() => { void salvar('curriculo'); }}
                disabled={salvando}
                accessibilityRole="button"
              >
                {salvando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.botaoTexto}>
                  {salvando ? 'Salvando currículo...' : 'Salvar alterações'}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.privacidade}>
              Seus dados de contato ficam neste
              dispositivo nesta versão. Ainda não
              são publicados para recrutadores.
            </Text>
          </View>

          {/* ARQUIVO ORIGINAL: PDF OU WORD */}
          <CurriculoOriginal chavePerfil={chave} />

          {/* ARENA VENTRYA */}

          <View style={styles.cartao}>
            <View style={styles.tituloComIcone}>
              <Ionicons
                name="game-controller-outline"
                size={23}
                color="#D78AFF"
              />

              <Text style={styles.secaoTitulo}>
                Arena Ventrya
              </Text>
            </View>

            <Text style={styles.secaoDescricao}>
              Treine sua lógica, inglês, português e
              matemática em sete desafios!
            </Text>

            <Text style={styles.arenaPontuacao}>
              {totalRecordes(pontuacoes)} / 700 pontos
            </Text>

            <Text style={styles.arenaLegenda}>
              Soma dos melhores resultados dos sete jogos.
            </Text>

            <View style={styles.jogos}>
              {([
                {
                  id: 'sequencia',
                  nome: 'Sequência Lógica',
                  icone: 'analytics-outline',
                },
                {
                  id: 'sudoku',
                  nome: 'Sudoku Mestre',
                  icone: 'grid-outline',
                },
                {
                  id: 'labirinto',
                  nome: 'Labirinto Estratégico',
                  icone: 'git-branch-outline',
                },
                {
                  id: 'memoria',
                  nome: 'Memória Tech',
                  icone: 'grid-outline',
                },
                {
                  id: 'ingles',
                  nome: 'Teste de Inglês',
                  icone: 'language-outline',
                },
                {
                  id: 'portugues',
                  nome: 'Teste de Português',
                  icone: 'book-outline',
                },
                {
                  id: 'matematica',
                  nome: 'Teste de Matemática',
                  icone: 'calculator-outline',
                },
              ] as const).map(item => (
                <View
                  key={item.id}
                  style={styles.jogoItem}
                >
                  <Ionicons
                    name={item.icone}
                    size={20}
                    color="#C990EE"
                  />

                  <Text style={styles.jogoTexto}>
                    {item.nome}
                  </Text>

                  <Text style={styles.emBreve}>
                    {pontuacoes[item.id]?.melhor ?? 0}/100
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.botaoArena}
              onPress={() =>
                router.push('/arena')
              }
              accessibilityLabel="Abrir Arena Ventrya"
            >
              <Ionicons
                name="play-circle-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.botaoTexto}>
                Jogar agora
              </Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.rodape}>
            VENTRYA • GLOBAL SOLUTION 2026
          </Text>
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
  container: {
    flex: 1,
  },

  carregando: {
    flex: 1,
    backgroundColor: '#08040E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  scroll: {
    paddingHorizontal: 18,
    paddingTop: 35,
    paddingBottom: 40,
    alignItems: 'center',
  },

  largura: {
    width: '100%',
    maxWidth: 540,
  },

  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 23,
  },

  selo: {
    color: '#D58AFF',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 8,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
  },

  subtitulo: {
    color: '#C4B1D2',
    fontSize: 12,
    marginTop: 6,
  },

  cartaoDestaque: {
    alignItems: 'center',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#70408C',
    padding: 20,
    marginBottom: 15,
  },

  avatarCirculo: {
    width: 178,
    height: 178,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: '#C85AFF',
    backgroundColor: '#241033',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 13,
  },

  conviteAvatar: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 9,
    marginBottom: 12,
    gap: 9,
  },

  conviteIcone: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: '#A95BDE',
    backgroundColor: '#48235F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  conviteTitulo: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },

  conviteTexto: {
    color: '#D9BFE8',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 310,
  },

  nome: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },

  cargo: {
    color: '#D7B5E9',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 17,
  },

  botaoPrincipal: {
    backgroundColor: '#8238B0',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  botaoSalvarAvatar: {
    marginTop: 17,
  },

  botaoTexto: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  nota: {
    color: '#AD97C0',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 13,
    lineHeight: 16,
  },

  cartao: {
    backgroundColor: '#24132F',
    borderWidth: 1,
    borderColor: '#5C3670',
    borderRadius: 19,
    padding: 18,
    marginBottom: 15,
  },

  secaoTitulo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  secaoDescricao: {
    color: '#BCA6CD',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
    marginBottom: 15,
  },

  etiqueta: {
    color: '#E7C5F8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 10,
  },

  linhaOpcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    alignItems: 'center',
  },

  amostraBorda: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 25,
    padding: 3,
  },

  amostraAtiva: {
    borderColor: '#E5A4FF',
  },

  amostra: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFFFFF44',
  },

  opcao: {
    backgroundColor: '#382046',
    borderWidth: 1,
    borderColor: '#5D3970',
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  opcaoSelecionada: {
    backgroundColor: '#633082',
    borderColor: '#D58AFF',
  },

  opcaoTexto: {
    color: '#C9B6D5',
    fontSize: 12,
  },

  opcaoTextoSelecionada: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  cabecalhoSecao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  tituloComIcone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  editarCurriculo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#3A204B',
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 10,
  },
  editarTexto: {
    color: '#E3A5FF',
    fontSize: 12,
    fontWeight: '800',
  },
  formulario: {
    gap: 13,
  },

  campoGrupo: {
    gap: 7,
  },

  campoTitulo: {
    color: '#DFC5ED',
    fontSize: 12,
    fontWeight: '700',
  },

  input: {
    backgroundColor: '#180C23',
    color: '#FFFFFF',
    borderColor: '#5C3870',
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
    minHeight: 46,
  },

  inputGrande: {
    minHeight: 90,
  },

  resumo: {
    gap: 5,
  },

  resumoRotulo: {
    color: '#D994FA',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 10,
  },

  resumoValor: {
    color: '#E9DAF1',
    fontSize: 13,
    lineHeight: 19,
  },

  privacidade: {
    color: '#A78DB8',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 17,
  },

  arenaPontuacao: {
    color: '#E6ADFF',
    fontSize: 27,
    fontWeight: '900',
    marginBottom: 3,
  },

  arenaLegenda: {
    color: '#BBA4C9',
    fontSize: 11,
    marginBottom: 15,
  },

  botaoArena: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#8738B8',
    padding: 15,
    borderRadius: 13,
    marginTop: 16,
  },

  jogos: {
    gap: 9,
  },

  jogoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#301B3D',
    padding: 12,
    borderRadius: 11,
    gap: 9,
  },

  jogoTexto: {
    flex: 1,
    color: '#E5D4ED',
    fontSize: 12,
    fontWeight: '600',
  },

  emBreve: {
    color: '#B68DCD',
    fontSize: 10,
  },

  salvar: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8738B8',
    borderRadius: 13,
    padding: 17,
    marginTop: 5,
  },

  aviso: {
    color: '#E3B5FF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },

  rodape: {
    color: '#806A90',
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 28,
  },
});
