
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type JogoId =
  | 'sequencia'
  | 'sudoku'
  | 'labirinto'
  | 'memoria'
  | 'ingles'
  | 'portugues'
  | 'matematica';

export type RegistroJogo = {
  melhor: number;
  ultima: number;
  partidas: number;
  atualizadoEm: string;
};

export type PontuacoesArena = Partial<
  Record<JogoId | 'padroes', RegistroJogo>
>;

// Padrões Visuais foi substituído pelo Sudoku.
// O histórico antigo é preservado.
const CHAVES_JOGOS: (JogoId | 'padroes')[] = [
  'sequencia',
  'sudoku',
  'labirinto',
  'memoria',
  'ingles',
  'portugues',
  'matematica',
  'padroes',
];

const JOGOS_ATIVOS: JogoId[] = [
  'sequencia',
  'sudoku',
  'labirinto',
  'memoria',
  'ingles',
  'portugues',
  'matematica',
];

async function ler(
  chave: string,
  sessao = false
): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;

    return sessao
      ? window.sessionStorage.getItem(chave)
      : window.localStorage.getItem(chave);
  }

  return SecureStore.getItemAsync(chave);
}

async function gravar(
  chave: string,
  texto: string
): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(chave, texto);
    return;
  }

  await SecureStore.setItemAsync(chave, texto);
}

function chaveArena(identificador: string): string {
  const normalizado = identificador.trim().toLowerCase();

  let hash = 2166136261;

  for (let i = 0; i < normalizado.length; i++) {
    hash = Math.imul(
      hash ^ normalizado.charCodeAt(i),
      16777619
    );
  }

  const sufixo = (hash >>> 0).toString(36);

  const prefixo = normalizado
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 50);

  return `ventrya_arena_${prefixo}_${sufixo}`;
}

export async function obterUsuarioArena(): Promise<{
  id: string;
  nome: string;
} | null> {
  const [token, textoUsuario] = await Promise.all([
    ler('ventrya_token', true),
    ler('ventrya_user', true),
  ]);

  if (!token || !textoUsuario) return null;

  try {
    const usuario = JSON.parse(textoUsuario);

    const id = String(
      usuario?.id ??
      usuario?.email ??
      usuario?.name ??
      ''
    ).trim();

    if (!id) return null;

    return {
      id,
      nome: String(usuario?.name || 'Estudante Ventrya'),
    };
  } catch {
    return null;
  }
}

export async function carregarPontuacoes(
  idUsuario: string
): Promise<PontuacoesArena> {
  try {
    const salvo = await ler(chaveArena(idUsuario));

    if (!salvo) return {};

    const bruto: unknown = JSON.parse(salvo);

    if (
      !bruto ||
      typeof bruto !== 'object' ||
      Array.isArray(bruto)
    ) {
      return {};
    }

    const registro = bruto as Record<string, unknown>;
    const resultado: PontuacoesArena = {};

    for (const jogo of CHAVES_JOGOS) {
      const item = registro[jogo];

      if (!item || typeof item !== 'object') continue;

      const dado = item as Partial<RegistroJogo>;

      if (
        typeof dado.melhor !== 'number' ||
        !Number.isFinite(dado.melhor)
      ) {
        continue;
      }

      resultado[jogo] = {
        melhor: Math.max(0, Math.min(100, dado.melhor)),
        ultima:
          typeof dado.ultima === 'number'
            ? dado.ultima
            : dado.melhor,
        partidas:
          typeof dado.partidas === 'number'
            ? dado.partidas
            : 1,
        atualizadoEm:
          typeof dado.atualizadoEm === 'string'
            ? dado.atualizadoEm
            : '',
      };
    }

    return resultado;
  } catch {
    return {};
  }
}

export async function registrarPontuacao(
  idUsuario: string,
  jogo: JogoId,
  pontos: number
): Promise<PontuacoesArena> {
  const anteriores = await carregarPontuacoes(idUsuario);
  const anterior = anteriores[jogo];

  const nota = Math.max(
    0,
    Math.min(100, Math.round(pontos))
  );

  const novos: PontuacoesArena = {
    ...anteriores,
    [jogo]: {
      melhor: Math.max(anterior?.melhor ?? 0, nota),
      ultima: nota,
      partidas: (anterior?.partidas ?? 0) + 1,
      atualizadoEm: new Date().toISOString(),
    },
  };

  await gravar(
    chaveArena(idUsuario),
    JSON.stringify(novos)
  );

  return novos;
}

export function totalRecordes(
  pontos: PontuacoesArena
): number {
  return JOGOS_ATIVOS.reduce(
    (soma, jogo) => soma + (pontos[jogo]?.melhor ?? 0),
    0
  );
}
