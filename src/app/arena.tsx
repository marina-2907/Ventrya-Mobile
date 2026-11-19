import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import BottomNav from '../components/BottomNav';
import {
  carregarPontuacoes,
  obterUsuarioArena,
  registrarPontuacao,
  totalRecordes,
  type JogoId,
  type PontuacoesArena,
} from '../services/arenaStorage';

type Icone = React.ComponentProps<typeof Ionicons>['name'];
type QuizId = 'sequencia' | 'ingles' | 'portugues' | 'matematica';
type Questao = {
  pergunta: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
};

type ConfigJogo = {
  id: JogoId;
  nome: string;
  descricao: string;
  icone: Icone;
  dificuldade: string;
};

const JOGOS: ConfigJogo[] = [
  { id: 'sequencia', nome: 'Sequência Lógica', descricao: 'Descubra o próximo número.', icone: 'git-branch-outline', dificuldade: 'Raciocínio' },
  { id: 'sudoku', nome: 'Sudoku Mestre', descricao: 'Complete um Sudoku 4 × 4.', icone: 'grid-outline', dificuldade: 'Estratégia' },
  { id: 'labirinto', nome: 'Labirinto Estratégico', descricao: 'Encontre a saída em 5 fases.', icone: 'navigate-outline', dificuldade: 'Planejamento' },
  { id: 'memoria', nome: 'Memória Tech', descricao: 'Encontre os pares escondidos.', icone: 'albums-outline', dificuldade: 'Memória' },
  { id: 'ingles', nome: 'Inglês', descricao: 'Responda perguntas de inglês.', icone: 'language-outline', dificuldade: 'Idiomas' },
  { id: 'portugues', nome: 'Português', descricao: 'Teste seu conhecimento da língua.', icone: 'book-outline', dificuldade: 'Linguagem' },
  { id: 'matematica', nome: 'Matemática', descricao: 'Resolva cálculos rápidos.', icone: 'calculator-outline', dificuldade: 'Cálculo' },
];

const QUESTOES: Record<QuizId, Questao[]> = {
  sequencia: [
    { pergunta: '2, 4, 8, 16, ...', opcoes: ['18', '24', '32', '36'], correta: 2, explicacao: 'Cada termo é o dobro do anterior.' },
    { pergunta: '3, 6, 9, 12, ...', opcoes: ['15', '16', '18', '21'], correta: 0, explicacao: 'A sequência aumenta de 3 em 3.' },
    { pergunta: '1, 1, 2, 3, 5, ...', opcoes: ['6', '7', '8', '10'], correta: 2, explicacao: 'Na sequência de Fibonacci, somamos os dois termos anteriores.' },
    { pergunta: '100, 90, 80, 70, ...', opcoes: ['50', '55', '60', '65'], correta: 2, explicacao: 'A sequência diminui de 10 em 10.' },
    { pergunta: '2, 5, 10, 17, 26, ...', opcoes: ['35', '36', '37', '39'], correta: 2, explicacao: 'A diferença aumenta de 2 em 2: 3, 5, 7, 9, 11.' },
  ],
  ingles: [
    { pergunta: 'Como se diz “entrevista de emprego” em inglês?', opcoes: ['Job interview', 'Job travel', 'Work story', 'Job window'], correta: 0, explicacao: 'Job interview significa entrevista de emprego.' },
    { pergunta: 'Complete: She ___ a developer.', opcoes: ['am', 'are', 'is', 'be'], correta: 2, explicacao: 'Com she, usamos is.' },
    { pergunta: 'Qual é o passado de “go”?', opcoes: ['Goed', 'Went', 'Gone', 'Going'], correta: 1, explicacao: 'O simple past de go é went.' },
    { pergunta: 'O que significa “skills”?', opcoes: ['Horários', 'Projetos', 'Habilidades', 'Salários'], correta: 2, explicacao: 'Skills significa habilidades.' },
    { pergunta: 'Complete: I have ___ experience.', opcoes: ['some', 'many', 'an', 'a'], correta: 0, explicacao: 'Experience é um substantivo incontável nesse contexto; some é adequado.' },
  ],
  portugues: [
    { pergunta: 'Qual alternativa está corretamente escrita?', opcoes: ['Excessão', 'Exceção', 'Esceção', 'Exessão'], correta: 1, explicacao: 'A grafia correta é exceção.' },
    { pergunta: 'Qual é o plural de “cidadão”?', opcoes: ['Cidadões', 'Cidadães', 'Cidadãos', 'Cidadãoses'], correta: 2, explicacao: 'O plural correto é cidadãos.' },
    { pergunta: 'Em qual frase a crase está correta?', opcoes: ['Vou à escola.', 'Vou à pé.', 'Cheguei à casa ontem, sem determinante.', 'Vou à estudar.'], correta: 0, explicacao: 'Antes de escola, ocorre a fusão da preposição a com o artigo a.' },
    { pergunta: 'Qual palavra é um verbo?', opcoes: ['Bonito', 'Aprender', 'Caderno', 'Feliz'], correta: 1, explicacao: 'Aprender expressa uma ação e é um verbo.' },
    { pergunta: 'Qual frase apresenta concordância correta?', opcoes: ['Os aluno chegou.', 'As pessoas chegaram.', 'Nós vai estudar.', 'Eles estuda muito.'], correta: 1, explicacao: 'O verbo chegaram concorda com o sujeito plural pessoas.' },
  ],
  matematica: [
    { pergunta: 'Quanto é 15 × 4?', opcoes: ['45', '50', '60', '65'], correta: 2, explicacao: '15 multiplicado por 4 é 60.' },
    { pergunta: 'Qual é 25% de 200?', opcoes: ['25', '40', '50', '75'], correta: 2, explicacao: 'Um quarto de 200 é 50.' },
    { pergunta: 'Quanto é 12²?', opcoes: ['124', '144', '122', '148'], correta: 1, explicacao: '12 × 12 = 144.' },
    { pergunta: 'Resolva: 3x + 6 = 21.', opcoes: ['3', '5', '7', '9'], correta: 1, explicacao: '3x = 15, então x = 5.' },
    { pergunta: 'Qual é a média de 6, 8 e 10?', opcoes: ['7', '8', '9', '10'], correta: 1, explicacao: '(6 + 8 + 10) ÷ 3 = 8.' },
  ],
};

const SOLUCAO_SUDOKU = [
  1, 2, 3, 4,
  3, 4, 1, 2,
  2, 1, 4, 3,
  4, 3, 2, 1,
];
const SUDOKU_INICIAL = [
  1, 0, 3, 0,
  0, 4, 0, 2,
  2, 0, 0, 3,
  0, 3, 2, 0,
];

// Cinco labirintos 5x5. S = início, E = saída, # = parede.
const LABIRINTOS = [
  ['S...#', '###.#', '#...#', '#.###', '#...E'],
  ['S#...', '.#.#.', '...#.', '.###.', '....E'],
  ['S....', '####.', '...#.', '.#.#.', '...#E'],
  ['S#...', '.#.#.', '.#.#.', '...#.', '##..E'],
  ['S..##', '##.##', '...##', '.####', '....E'],
];

type Carta = { id: number; valor: string };
const FIGURAS = ['💻', '🧠', '📚', '🎯'];

function criarCartas(): Carta[] {
  const cartas = [...FIGURAS, ...FIGURAS].map((valor, id) => ({ valor, id }));
  for (let i = cartas.length - 1; i > 0; i--) {
    const sorteado = Math.floor(Math.random() * (i + 1));
    [cartas[i], cartas[sorteado]] = [cartas[sorteado], cartas[i]];
  }
  return cartas;
}

function ehQuiz(id: JogoId | null): id is QuizId {
  return id === 'sequencia' || id === 'ingles' || id === 'portugues' || id === 'matematica';
}

export default function ArenaScreen() {
  const [usuario, setUsuario] = useState<{ id: string; nome: string } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [pontuacoes, setPontuacoes] = useState<PontuacoesArena>({});
  const [jogo, setJogo] = useState<JogoId | null>(null);
  const [resultado, setResultado] = useState<{ jogo: JogoId; pontos: number; salvo: boolean } | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [indiceQuiz, setIndiceQuiz] = useState(0);
  const [acertosQuiz, setAcertosQuiz] = useState(0);
  const [respostaQuiz, setRespostaQuiz] = useState<number | null>(null);

  const [valoresSudoku, setValoresSudoku] = useState<(number | null)[]>(SUDOKU_INICIAL.map((v) => v || null));
  const [celulaSudoku, setCelulaSudoku] = useState<number | null>(null);
  const [avisoSudoku, setAvisoSudoku] = useState('');

  const [nivelLabirinto, setNivelLabirinto] = useState(0);
  const [posicao, setPosicao] = useState<[number, number]>([0, 0]);
  const [avisoLabirinto, setAvisoLabirinto] = useState('');

  const [cartas, setCartas] = useState<Carta[]>(criarCartas);
  const [viradas, setViradas] = useState<number[]>([]);
  const [encontrados, setEncontrados] = useState<string[]>([]);
  const [errosMemoria, setErrosMemoria] = useState(0);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const conta = await obterUsuarioArena();
        if (!ativo) return;
        setUsuario(conta);
        if (conta?.id) {
          const dados = await carregarPontuacoes(conta.id);
          if (ativo) setPontuacoes(dados);
        }
      } catch (erro) {
        console.warn('Não foi possível carregar os recordes da Arena.', erro);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  function voltar() {
    setJogo(null);
    setResultado(null);
  }

  function iniciar(id: JogoId) {
    setResultado(null);
    setJogo(id);
    setIndiceQuiz(0);
    setAcertosQuiz(0);
    setRespostaQuiz(null);
    setValoresSudoku(SUDOKU_INICIAL.map((v) => v || null));
    setCelulaSudoku(null);
    setAvisoSudoku('');
    setNivelLabirinto(0);
    setPosicao([0, 0]);
    setAvisoLabirinto('');
    setCartas(criarCartas());
    setViradas([]);
    setEncontrados([]);
    setErrosMemoria(0);
  }

  async function concluir(id: JogoId, pontos: number) {
    if (salvando) return;
    setSalvando(true);
    const nota = Math.min(100, Math.max(0, Math.round(pontos)));
    let salvo = false;
    if (usuario?.id) {
      try {
        const atualizadas = await registrarPontuacao(usuario.id, id, nota);
        setPontuacoes(atualizadas);
        salvo = true;
      } catch (erro) {
        console.warn('Não foi possível registrar a pontuação.', erro);
      }
    }
    setResultado({ jogo: id, pontos: nota, salvo });
    setSalvando(false);
  }

  function responderQuiz(indice: number) {
    if (!ehQuiz(jogo) || respostaQuiz !== null) return;
    setRespostaQuiz(indice);
    if (indice === QUESTOES[jogo][indiceQuiz].correta) {
      setAcertosQuiz((atual) => atual + 1);
    }
  }

  function proximaQuestao() {
    if (!ehQuiz(jogo) || respostaQuiz === null) return;
    if (indiceQuiz === QUESTOES[jogo].length - 1) {
      void concluir(jogo, acertosQuiz * 20);
    } else {
      setIndiceQuiz((anterior) => anterior + 1);
      setRespostaQuiz(null);
    }
  }

  function preencherSudoku(numero: number) {
    if (celulaSudoku === null || SUDOKU_INICIAL[celulaSudoku] !== 0) return;
    setValoresSudoku((anterior) => anterior.map((valor, i) => i === celulaSudoku ? numero : valor));
    setAvisoSudoku('');
  }

  function conferirSudoku() {
    const completo = valoresSudoku.every((valor, indice) => valor === SOLUCAO_SUDOKU[indice]);
    if (completo) {
      void concluir('sudoku', 100);
    } else {
      setAvisoSudoku('Ainda há casas vazias ou números incorretos. Continue tentando!');
    }
  }

  function mover(direcao: 'cima' | 'baixo' | 'esquerda' | 'direita') {
    const delta: Record<typeof direcao, [number, number]> = {
      cima: [-1, 0], baixo: [1, 0], esquerda: [0, -1], direita: [0, 1],
    };
    const [linha, coluna] = posicao;
    const [dl, dc] = delta[direcao];
    const novaLinha = linha + dl;
    const novaColuna = coluna + dc;
    const mapa = LABIRINTOS[nivelLabirinto];
    if (novaLinha < 0 || novaColuna < 0 || novaLinha >= 5 || novaColuna >= 5 || mapa[novaLinha][novaColuna] === '#') {
      setAvisoLabirinto('Há uma parede nessa direção. Tente outro caminho.');
      return;
    }
    setAvisoLabirinto('');
    if (mapa[novaLinha][novaColuna] === 'E') {
      if (nivelLabirinto === LABIRINTOS.length - 1) {
        void concluir('labirinto', 100);
      } else {
        setNivelLabirinto((atual) => atual + 1);
        setPosicao([0, 0]);
        setAvisoLabirinto('Boa! Você passou de fase.');
      }
    } else {
      setPosicao([novaLinha, novaColuna]);
    }
  }

  function virarCarta(indice: number) {
    const carta = cartas[indice];
    if (encontrados.includes(carta.valor) || viradas.includes(indice)) return;

    // Duas cartas erradas ficam visíveis até a próxima tentativa.
    const primeiraVirada = viradas.length === 2 ? [] : viradas;
    if (primeiraVirada.length === 0) {
      setViradas([indice]);
      return;
    }

    const primeira = cartas[primeiraVirada[0]];
    if (primeira.valor === carta.valor) {
      const novosEncontrados = [...encontrados, carta.valor];
      setEncontrados(novosEncontrados);
      setViradas([]);
      if (novosEncontrados.length === FIGURAS.length) {
        const pontos = Math.max(40, 100 - errosMemoria * 10);
        void concluir('memoria', pontos);
      }
    } else {
      setViradas([primeiraVirada[0], indice]);
      setErrosMemoria((atual) => atual + 1);
    }
  }

  const configuracaoAtual = JOGOS.find((item) => item.id === jogo);
  const total = totalRecordes(pontuacoes);
  const concluidos = JOGOS.filter((item) => (pontuacoes[item.id]?.partidas ?? 0) > 0).length;

  function renderizarQuiz(id: QuizId) {
    const perguntas = QUESTOES[id];
    const pergunta = perguntas[indiceQuiz];
    return (
      <View style={styles.cartaoDesafio}>
        <Text style={styles.progresso}>PERGUNTA {indiceQuiz + 1} DE {perguntas.length}</Text>
        <Text style={styles.pergunta}>{pergunta.pergunta}</Text>
        <View style={styles.opcoes}>
          {pergunta.opcoes.map((opcao, indice) => {
            const respondida = respostaQuiz !== null;
            const correta = indice === pergunta.correta;
            const selecionadaErrada = indice === respostaQuiz && !correta;
            return (
              <Pressable
                key={`${indice}-${opcao}`}
                accessibilityRole="button"
                disabled={respondida}
                onPress={() => responderQuiz(indice)}
                style={[
                  styles.opcao,
                  respondida && correta && styles.opcaoCerta,
                  respondida && selecionadaErrada && styles.opcaoErrada,
                ]}
              >
                <Text style={styles.opcaoLetra}>{String.fromCharCode(65 + indice)}</Text>
                <Text style={styles.opcaoTexto}>{opcao}</Text>
                {respondida && correta && <Ionicons name="checkmark-circle" size={19} color="#B7FFD3" />}
                {respondida && selecionadaErrada && <Ionicons name="close-circle" size={19} color="#FFC1CE" />}
              </Pressable>
            );
          })}
        </View>
        {respostaQuiz !== null && (
          <View style={styles.areaFeedback}>
            <Text style={styles.feedbackTitulo}>{respostaQuiz === pergunta.correta ? 'Você acertou!' : 'Continue aprendendo!'}</Text>
            <Text style={styles.textoSecundario}>{pergunta.explicacao}</Text>
            <Pressable style={styles.botaoPrincipal} onPress={proximaQuestao}>
              <Text style={styles.botaoPrincipalTexto}>{indiceQuiz === perguntas.length - 1 ? 'Ver resultado' : 'Próxima questão'}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  function renderizarSudoku() {
    return (
      <View style={styles.cartaoDesafio}>
        <Text style={styles.progresso}>DESAFIO DE ESTRATÉGIA</Text>
        <Text style={styles.pergunta}>Sudoku 4 × 4</Text>
        <Text style={styles.textoSecundario}>Complete as casas vazias com os números de 1 a 4, sem repeti-los na linha, na coluna ou em cada bloco 2 × 2.</Text>
        <View style={styles.gradeSudoku}>
          {valoresSudoku.map((valor, indice) => {
            const fixo = SUDOKU_INICIAL[indice] !== 0;
            return (
              <Pressable
                key={`sudoku-${indice}`}
                disabled={fixo}
                onPress={() => { setCelulaSudoku(indice); setAvisoSudoku(''); }}
                style={[
                  styles.celulaSudoku,
                  fixo && styles.sudokuFixo,
                  !fixo && celulaSudoku === indice && styles.sudokuSelecionado,
                  indice % 4 === 1 && styles.bordaBlocoDireita,
                  Math.floor(indice / 4) === 1 && styles.bordaBlocoBaixo,
                ]}
              >
                <Text style={[styles.numeroSudoku, fixo && styles.numeroFixo]}>{valor ?? ''}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.textoSecundario}>Toque em uma casa vazia e escolha um número:</Text>
        <View style={styles.linhaNumeros}>
          {[1, 2, 3, 4].map((numero) => (
            <Pressable key={numero} onPress={() => preencherSudoku(numero)} style={styles.botaoNumero}>
              <Text style={styles.botaoNumeroTexto}>{numero}</Text>
            </Pressable>
          ))}
        </View>
        {!!avisoSudoku && <Text style={styles.aviso}>{avisoSudoku}</Text>}
        <Pressable style={styles.botaoPrincipal} onPress={conferirSudoku}>
          <Text style={styles.botaoPrincipalTexto}>Conferir Sudoku</Text>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    );
  }

  function renderizarLabirinto() {
    const mapa = LABIRINTOS[nivelLabirinto];
    return (
      <View style={styles.cartaoDesafio}>
        <Text style={styles.progresso}>FASE {nivelLabirinto + 1} DE {LABIRINTOS.length}</Text>
        <Text style={styles.pergunta}>Encontre a saída</Text>
        <Text style={styles.textoSecundario}>Use as setas para levar o personagem roxo até a saída verde, desviando das paredes.</Text>
        <View style={styles.gradeLabirinto}>
          {mapa.flatMap((linha, i) => [...linha].map((caractere, j) => {
            const jogador = posicao[0] === i && posicao[1] === j;
            return (
              <View key={`l${i}c${j}`} style={[
                styles.celulaLabirinto,
                caractere === '#' && styles.parede,
                caractere === 'E' && styles.saida,
                jogador && styles.posicaoJogador,
              ]}>
                <Text style={styles.celulaLabirintoTexto}>{jogador ? '●' : caractere === 'E' ? '★' : ''}</Text>
              </View>
            );
          }))}
        </View>
        <View style={styles.controlesLabirinto}>
          <Pressable onPress={() => mover('cima')} style={styles.seta}><Ionicons name="arrow-up" size={24} color="#FFFFFF" /></Pressable>
          <View style={styles.linhaSetas}>
            <Pressable onPress={() => mover('esquerda')} style={styles.seta}><Ionicons name="arrow-back" size={24} color="#FFFFFF" /></Pressable>
            <Pressable onPress={() => mover('baixo')} style={styles.seta}><Ionicons name="arrow-down" size={24} color="#FFFFFF" /></Pressable>
            <Pressable onPress={() => mover('direita')} style={styles.seta}><Ionicons name="arrow-forward" size={24} color="#FFFFFF" /></Pressable>
          </View>
        </View>
        {!!avisoLabirinto && <Text style={styles.aviso}>{avisoLabirinto}</Text>}
      </View>
    );
  }

  function renderizarMemoria() {
    return (
      <View style={styles.cartaoDesafio}>
        <Text style={styles.progresso}>{encontrados.length} DE {FIGURAS.length} PARES ENCONTRADOS</Text>
        <Text style={styles.pergunta}>Memória Tech</Text>
        <Text style={styles.textoSecundario}>Vire duas cartas e encontre as figuras iguais. Quando errar, escolha outra carta para começar uma nova tentativa.</Text>
        <View style={styles.gradeMemoria}>
          {cartas.map((carta, indice) => {
            const visivel = viradas.includes(indice) || encontrados.includes(carta.valor);
            const encontrado = encontrados.includes(carta.valor);
            return (
              <Pressable
                key={carta.id}
                onPress={() => virarCarta(indice)}
                accessibilityRole="button"
                accessibilityLabel={`Carta ${indice + 1}${visivel ? `: ${carta.valor}` : ' escondida'}`}
                style={[styles.carta, visivel && styles.cartaAberta, encontrado && styles.cartaEncontrada]}
              >
                <Text style={styles.figuraCarta}>{visivel ? carta.valor : '?'}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.textoSecundario}>Tentativas incorretas: {errosMemoria}. Cada erro reduz 10 pontos, até o mínimo de 40.</Text>
      </View>
    );
  }

  function renderizarResultado() {
    if (!resultado) return null;
    const config = JOGOS.find((item) => item.id === resultado.jogo);
    return (
      <View style={styles.resultado}>
        <Ionicons name="trophy" size={52} color="#F4D084" />
        <Text style={styles.resultadoTitulo}>Desafio concluído!</Text>
        <Text style={styles.textoSecundario}>{config?.nome}</Text>
        <Text style={styles.resultadoPontos}>{resultado.pontos}<Text style={styles.resultadoTotal}>/100 pontos</Text></Text>
        <Text style={styles.resultadoNota}>{resultado.salvo ? 'Pontuação registrada no seu perfil.' : 'Resultado concluído, mas não foi possível salvar. Confira seu login e tente novamente.'}</Text>
        <Pressable style={styles.botaoPrincipal} onPress={() => iniciar(resultado.jogo)}>
          <Text style={styles.botaoPrincipalTexto}>Jogar novamente</Text>
          <Ionicons name="refresh" size={19} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.botaoSecundario} onPress={voltar}>
          <Text style={styles.botaoSecundarioTexto}>Voltar para a Arena</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.conteudo}>
        <View style={styles.cabecalho}>
          <View style={styles.logo}><Ionicons name="game-controller" size={26} color="#EED1FF" /></View>
          <View style={styles.cabecalhoInfo}>
            <Text style={styles.chapeu}>VENTRYA • DESAFIOS</Text>
            <Text style={styles.titulo}>Arena Ventrya</Text>
          </View>
          <Pressable onPress={() => jogo || resultado ? voltar() : router.push('/perfil')} style={styles.botaoVoltar} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={20} color="#EADAF5" />
          </Pressable>
        </View>

        {carregando ? (
          <View style={styles.central}><ActivityIndicator color="#B77FF4" size="large" /><Text style={styles.textoSecundario}>Carregando Arena...</Text></View>
        ) : resultado ? renderizarResultado() : jogo ? (
          <View>
            <Pressable style={styles.voltarJogo} onPress={voltar}>
              <Ionicons name="chevron-back" color="#C6A8E8" size={18} />
              <Text style={styles.voltarJogoTexto}>Todos os jogos</Text>
            </Pressable>
            <Text style={styles.tituloJogo}>{configuracaoAtual?.nome}</Text>
            {ehQuiz(jogo) && renderizarQuiz(jogo)}
            {jogo === 'sudoku' && renderizarSudoku()}
            {jogo === 'labirinto' && renderizarLabirinto()}
            {jogo === 'memoria' && renderizarMemoria()}
            {salvando && <View style={styles.central}><ActivityIndicator color="#B77FF4" /><Text style={styles.textoSecundario}>Salvando pontuação...</Text></View>}
          </View>
        ) : (
          <>
            <View style={styles.banner}>
              <Text style={styles.bannerTitulo}>Seu talento vai além do currículo.</Text>
              <Text style={styles.bannerDescricao}>Treine suas habilidades com jogos rápidos e acompanhe seus recordes. Cada jogo vale até 100 pontos.</Text>
            </View>

            <View style={styles.estatisticas}>
              <View style={styles.estatistica}>
                <Text style={styles.estatisticaLegenda}>Pontuação total</Text>
                <Text style={styles.estatisticaNumero}>{total}<Text style={styles.estatisticaMax}> / 700</Text></Text>
              </View>
              <View style={styles.estatistica}>
                <Text style={styles.estatisticaLegenda}>Jogos concluídos</Text>
                <Text style={styles.estatisticaNumero}>{concluidos}<Text style={styles.estatisticaMax}> / 7</Text></Text>
              </View>
            </View>

            {!usuario && (
              <View style={styles.avisoLogin}>
                <Ionicons name="information-circle-outline" size={20} color="#D7BCF3" />
                <Text style={styles.avisoLoginTexto}>Entre na sua conta para salvar os recordes individualmente.</Text>
                <Pressable onPress={() => router.push('/login')}><Text style={styles.linkLogin}>Entrar</Text></Pressable>
              </View>
            )}

            <Text style={styles.secaoTitulo}>Escolha seu desafio</Text>
            <Text style={styles.secaoDescricao}>Sete jogos para praticar lógica, memória, idiomas e matemática.</Text>
            <View style={styles.gradeJogos}>
              {JOGOS.map((item) => {
                const registro = pontuacoes[item.id];
                return (
                  <View key={item.id} style={styles.cartaoJogo}>
                    <View style={styles.iconeJogo}><Ionicons name={item.icone} size={24} color="#E0BBFF" /></View>
                    <Text style={styles.nomeJogo}>{item.nome}</Text>
                    <Text style={styles.descricaoJogo}>{item.descricao}</Text>
                    <Text style={styles.categoriaJogo}>{item.dificuldade}</Text>
                    <View style={styles.rodapeJogo}>
                      <Text style={styles.recorde}>Recorde: {registro?.melhor ?? 0}/100</Text>
                      <Pressable style={styles.jogar} accessibilityRole="button" onPress={() => iniciar(item.id)}>
                        <Text style={styles.jogarTexto}>Jogar</Text>
                        <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
            <Text style={styles.rodape}>VENTRYA • GLOBAL SOLUTION 2026</Text>
          </>
        )}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#110A1B' },
  scroll: { flex: 1 },
  conteudo: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 36, width: '100%', maxWidth: 980, alignSelf: 'center' },
  cabecalho: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logo: { width: 52, height: 52, borderRadius: 17, backgroundColor: '#3D205B', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cabecalhoInfo: { flex: 1 },
  chapeu: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: '#C6A0E8' },
  titulo: { fontSize: 25, fontWeight: '800', color: '#FFFFFF', marginTop: 3 },
  botaoVoltar: { width: 39, height: 39, borderRadius: 12, backgroundColor: '#2C1B3D', alignItems: 'center', justifyContent: 'center' },
  central: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12 },
  banner: { backgroundColor: '#3B2057', borderWidth: 1, borderColor: '#70418F', borderRadius: 22, padding: 22, marginBottom: 16 },
  bannerTitulo: { color: '#FFFFFF', fontWeight: '800', fontSize: 21, marginBottom: 8 },
  bannerDescricao: { color: '#E0CBED', fontSize: 14, lineHeight: 21 },
  estatisticas: { flexDirection: 'row', gap: 12, marginBottom: 23 },
  estatistica: { flex: 1, backgroundColor: '#24152F', borderWidth: 1, borderColor: '#453056', borderRadius: 17, padding: 17 },
  estatisticaLegenda: { color: '#BBA8CA', fontSize: 12, marginBottom: 8 },
  estatisticaNumero: { color: '#FFFFFF', fontSize: 27, fontWeight: '800' },
  estatisticaMax: { color: '#B69BC8', fontSize: 14, fontWeight: '500' },
  avisoLogin: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#35253C', borderRadius: 12, padding: 12, marginBottom: 20 },
  avisoLoginTexto: { color: '#E0C8E8', flex: 1, fontSize: 12 },
  linkLogin: { color: '#F2D1FF', fontWeight: '700' },
  secaoTitulo: { fontSize: 20, fontWeight: '800', color: '#F9F0FF', marginBottom: 4 },
  secaoDescricao: { fontSize: 13, color: '#AA95BC', marginBottom: 14 },
  gradeJogos: { flexDirection: 'row', flexWrap: 'wrap', gap: 13 },
  cartaoJogo: { flexBasis: '46%', flexGrow: 1, minWidth: 155, padding: 16, backgroundColor: '#251730', borderWidth: 1, borderColor: '#453052', borderRadius: 18 },
  iconeJogo: { width: 44, height: 44, backgroundColor: '#43265D', borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  nomeJogo: { color: '#F8F0FF', fontSize: 16, fontWeight: '800', minHeight: 23 },
  descricaoJogo: { color: '#BBA8C9', fontSize: 12, marginTop: 7, lineHeight: 18, minHeight: 36 },
  categoriaJogo: { color: '#D8B3F4', fontSize: 11, marginTop: 10, marginBottom: 13 },
  rodapeJogo: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  recorde: { color: '#D8C5E2', fontSize: 11, flexShrink: 1 },
  jogar: { backgroundColor: '#8F45BB', borderRadius: 11, paddingVertical: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  jogarTexto: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  rodape: { color: '#806E8E', fontSize: 11, textAlign: 'center', marginTop: 25, letterSpacing: 1 },
  voltarJogo: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  voltarJogoTexto: { color: '#C7A8EB', fontWeight: '600', fontSize: 13 },
  tituloJogo: { color: '#FFFFFF', fontWeight: '800', fontSize: 23, marginBottom: 14 },
  cartaoDesafio: { backgroundColor: '#261932', borderRadius: 19, padding: 19, borderWidth: 1, borderColor: '#4A315D', gap: 14 },
  progresso: { color: '#CB9DF0', letterSpacing: 1, fontSize: 11, fontWeight: '800' },
  pergunta: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', lineHeight: 28 },
  textoSecundario: { color: '#C9B7D8', lineHeight: 21, fontSize: 13 },
  opcoes: { gap: 10 },
  opcao: { backgroundColor: '#382345', flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#583C67' },
  opcaoCerta: { backgroundColor: '#24553D', borderColor: '#6BAF88' },
  opcaoErrada: { backgroundColor: '#683246', borderColor: '#C77A8E' },
  opcaoLetra: { color: '#E9C6FF', fontWeight: '800', width: 21 },
  opcaoTexto: { flex: 1, color: '#FFFFFF', fontSize: 14, lineHeight: 19 },
  areaFeedback: { gap: 10, paddingTop: 3 },
  feedbackTitulo: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  botaoPrincipal: { backgroundColor: '#8E3CBE', paddingHorizontal: 18, minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 5 },
  botaoPrincipalTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  botaoSecundario: { padding: 14, alignItems: 'center' },
  botaoSecundarioTexto: { color: '#D9B4F2', fontSize: 14, fontWeight: '700' },
  gradeSudoku: { flexDirection: 'row', flexWrap: 'wrap', width: 248, alignSelf: 'center', backgroundColor: '#4B3060', borderWidth: 2, borderColor: '#DCC1F5' },
  celulaSudoku: { width: 61, height: 61, backgroundColor: '#332140', borderWidth: 1, borderColor: '#6A527B', alignItems: 'center', justifyContent: 'center' },
  sudokuFixo: { backgroundColor: '#472E58' },
  sudokuSelecionado: { backgroundColor: '#745299' },
  bordaBlocoDireita: { borderRightWidth: 3, borderRightColor: '#D8B1F4' },
  bordaBlocoBaixo: { borderBottomWidth: 3, borderBottomColor: '#D8B1F4' },
  numeroSudoku: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  numeroFixo: { color: '#E8B9FF' },
  linhaNumeros: { flexDirection: 'row', justifyContent: 'center', gap: 11 },
  botaoNumero: { backgroundColor: '#74429C', borderRadius: 12, width: 49, height: 47, justifyContent: 'center', alignItems: 'center' },
  botaoNumeroTexto: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
  aviso: { color: '#EAD0FF', fontSize: 13, lineHeight: 20 },
  gradeLabirinto: { width: 250, flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center', borderRadius: 10, overflow: 'hidden' },
  celulaLabirinto: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: '#443158', borderWidth: 2, borderColor: '#251630' },
  parede: { backgroundColor: '#130C1C' },
  saida: { backgroundColor: '#2F8E66' },
  posicaoJogador: { backgroundColor: '#A76DE0' },
  celulaLabirintoTexto: { color: '#FFFFFF', fontSize: 25, fontWeight: '800' },
  controlesLabirinto: { alignItems: 'center', gap: 7 },
  linhaSetas: { flexDirection: 'row', gap: 7 },
  seta: { width: 54, height: 48, backgroundColor: '#74459A', justifyContent: 'center', alignItems: 'center', borderRadius: 11 },
  gradeMemoria: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, justifyContent: 'center' },
  carta: { width: 70, height: 82, borderRadius: 14, borderWidth: 1, borderColor: '#714A85', backgroundColor: '#58306F', justifyContent: 'center', alignItems: 'center' },
  cartaAberta: { backgroundColor: '#44335F' },
  cartaEncontrada: { backgroundColor: '#315B4B', borderColor: '#73BB95' },
  figuraCarta: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  resultado: { marginTop: 20, backgroundColor: '#251730', borderWidth: 1, borderColor: '#56396F', borderRadius: 22, alignItems: 'center', padding: 26, gap: 13 },
  resultadoTitulo: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  resultadoPontos: { color: '#E6B5FF', fontSize: 43, fontWeight: '900' },
  resultadoTotal: { color: '#C8ABD9', fontSize: 14, fontWeight: '500' },
  resultadoNota: { color: '#D4C4DE', textAlign: 'center', fontSize: 13, lineHeight: 20 },
});
