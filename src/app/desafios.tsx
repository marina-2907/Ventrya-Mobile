import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform, Alert, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { api } from '../services/api';
import BottomNav from '../components/BottomNav';

type Challenge = {
  id: number;
  title: string;
  description: string;
  professionalArea: string;
  difficulty: string;
  requirements: string | null;
  deadline: string | null;
  status: string;
  organizationId: number;
  organizationName: string;
  createdAt: string;
};
type Application = {
  id: number;
  studentId: number;
  studentName: string;
  challengeId: number;
  challengeTitle: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
};
type Page<T> = { content: T[]; totalPages: number; last: boolean };
type Aba = 'Explorar' | 'Disponíveis' | 'Minhas inscrições';
const ABAS: Aba[] = ['Explorar', 'Disponíveis', 'Minhas inscrições'];
const PURPLE = '#D66BFF';

async function tokenSalvo() {
  return Platform.OS === 'web'
    ? window.sessionStorage.getItem('ventrya_token')
    : SecureStore.getItemAsync('ventrya_token');
}
async function encerrarSessao() {
  if (Platform.OS === 'web') {
    window.sessionStorage.removeItem('ventrya_token');
    window.sessionStorage.removeItem('ventrya_user');
  } else {
    await SecureStore.deleteItemAsync('ventrya_token');
    await SecureStore.deleteItemAsync('ventrya_user');
  }
  router.replace('/login');
}
async function todasPaginas<T>(url: string, token: string): Promise<T[]> {
  const itens: T[] = [];
  for (let page = 0; page < 100; page++) {
    const { data } = await api.get<Page<T>>(url, {
      params: { page, size: 50 },
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!Array.isArray(data.content)) throw new Error('Resposta inválida da API');
    itens.push(...data.content);
    if (data.last === true || page + 1 >= data.totalPages) return itens;
  }
  throw new Error('Limite de páginas excedido');
}
function dataBR(value: string | null | undefined) {
  if (!value) return 'Não informado';
  const [ano, mes, dia] = value.slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : value;
}
function prazoValido(deadline: string | null) {
  if (!deadline) return true;
  const hoje = new Date();
  const local = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  return deadline.slice(0, 10) >= local;
}
// Confirmar os valores com ChallengeStatus.java. A API continua validando a regra real.
function desafioDisponivel(c: Challenge) {
  return ['OPEN', 'ACTIVE'].includes((c.status || '').toUpperCase()) && prazoValido(c.deadline);
}
function nivel(valor: string) {
  const nomes: Record<string, string> = {
    EASY: 'Fácil', BEGINNER: 'Iniciante', MEDIUM: 'Intermediário',
    INTERMEDIATE: 'Intermediário', HARD: 'Avançado', ADVANCED: 'Avançado',
  };
  return nomes[valor] || valor || 'Não informado';
}
function situacao(status: Application['status']) {
  if (status === 'APPROVED') return { texto: 'Aprovada', cor: '#A8F0C7', fundo: '#1C4938', icone: 'checkmark-circle' as const };
  if (status === 'REJECTED') return { texto: 'Não aprovada', cor: '#FFB0BB', fundo: '#512733', icone: 'close-circle' as const };
  return { texto: 'Em análise', cor: '#E9C3FF', fundo: '#4A2A61', icone: 'time' as const };
}
function aviso(titulo: string, mensagem: string) {
  if (Platform.OS === 'web') window.alert(`${titulo}\n\n${mensagem}`);
  else Alert.alert(titulo, mensagem);
}
function confirmar(titulo: string, mensagem: string, executar: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensagem}`)) executar();
  } else {
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: executar },
    ]);
  }
}

export default function DesafiosScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>('Explorar');
  const [busca, setBusca] = useState('');
  const [desafios, setDesafios] = useState<Challenge[]>([]);
  const [inscricoes, setInscricoes] = useState<Application[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);

  const carregar = useCallback(async (jwt: string, refresh = false) => {
    if (refresh) setAtualizando(true);
    else setCarregando(true);
    setErro('');
    try {
      const [lista, minhas] = await Promise.all([
        todasPaginas<Challenge>('/api/challenges', jwt),
        todasPaginas<Application>('/api/applications/me', jwt),
      ]);
      setDesafios(lista);
      setInscricoes(minhas);
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        await encerrarSessao();
        return;
      }
      setErro('Não foi possível atualizar os desafios. Verifique se a API Java está ligada.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const jwt = await tokenSalvo();
        if (!jwt) { router.replace('/login'); return; }
        if (!ativo) return;
        setToken(jwt);
        await carregar(jwt);
      } catch {
        if (ativo) setErro('Não foi possível recuperar sua sessão.');
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, [carregar]);

  const inscricaoPorDesafio = useMemo(() => new Map(inscricoes.map(i => [i.challengeId, i])), [inscricoes]);
  const disponiveis = desafios.filter(d => desafioDisponivel(d) && !inscricaoPorDesafio.has(d.id)).length;
  const aprovadas = inscricoes.filter(i => i.status === 'APPROVED').length;
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const desafiosVisiveis = desafios.filter(d => {
    if (aba === 'Disponíveis' && (!desafioDisponivel(d) || inscricaoPorDesafio.has(d.id))) return false;
    if (aba === 'Minhas inscrições') return false;
    return `${d.title} ${d.description || ''} ${d.organizationName || ''} ${d.professionalArea || ''}`
      .toLocaleLowerCase('pt-BR').includes(termo);
  });
  const inscricoesVisiveis = inscricoes.filter(i =>
    `${i.challengeTitle || ''} ${i.status}`.toLocaleLowerCase('pt-BR').includes(termo)
  ).sort((a, b) => (b.appliedAt || '').localeCompare(a.appliedAt || ''));

  async function cancelarInscricao(inscricao: Application) {
    if (!token || cancelando !== null) return;
    setCancelando(inscricao.id);
    try {
      await api.delete(`/api/applications/${inscricao.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInscricoes(anteriores => anteriores.filter(i => i.id !== inscricao.id));
      aviso('Inscrição cancelada', 'Sua inscrição foi cancelada com sucesso.');
      await carregar(token, true);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        if (status === 401) { await encerrarSessao(); return; }
        if (status === 409) {
          aviso('Cancelamento não permitido', 'Esta inscrição já possui uma solução enviada ou está vinculada a outros registros.');
          return;
        }
        if (status === 404) {
          aviso('Inscrição não encontrada', 'A inscrição não existe mais ou não pertence à sua conta.');
          await carregar(token, true);
          return;
        }
        if (status === 403) {
          aviso('Acesso negado', 'Você não tem permissão para cancelar esta inscrição.');
          return;
        }
      }
      aviso('Erro ao cancelar', 'Não foi possível cancelar a inscrição. Verifique a conexão com a API e tente novamente.');
    } finally {
      setCancelando(null);
    }
  }

  function confirmarCancelamento(inscricao: Application) {
    confirmar(
      'Cancelar inscrição',
      `Deseja realmente cancelar sua inscrição no desafio “${inscricao.challengeTitle}”? Essa ação não poderá ser desfeita.`,
      () => { void cancelarInscricao(inscricao); }
    );
  }

  async function enviarInscricao(desafio: Challenge) {
    if (!token || enviando !== null || inscricaoPorDesafio.has(desafio.id)) return;
    setEnviando(desafio.id);
    try {
      await api.post(`/api/applications/challenge/${desafio.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // O cadastro foi confirmado pela API; atualiza a listagem em seguida.
      setAba('Minhas inscrições');
      await carregar(token, true);
      aviso('Inscrição realizada!', 'Sua candidatura foi registrada. Acompanhe o status em Minhas inscrições.');
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        if (status === 401) { await encerrarSessao(); return; }
        if (status === 409) {
          aviso('Inscrição já existente', 'Você já se candidatou ou a inscrição conflita com uma regra do desafio.');
          await carregar(token, true);
          return;
        }
        if (status === 403) { aviso('Acesso negado', 'Sua conta não tem permissão para esta inscrição.'); return; }
        if (status === 400) { aviso('Inscrição indisponível', 'Verifique o prazo e a situação do desafio.'); return; }
      }
      aviso('Erro ao inscrever-se', 'Não foi possível concluir a inscrição. Tente novamente.');
    } finally { setEnviando(null); }
  }

  return (
    <LinearGradient colors={['#090410', '#150820', '#1D0B2A']} style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={atualizando} tintColor={PURPLE}
          onRefresh={() => { if (token) carregar(token, true); }} />}>
        <View style={styles.wrapper}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Desafios</Text>
              <Text style={styles.subtitle}>Descubra oportunidades para evoluir.</Text>
            </View>
            <View style={styles.topIcon}><Ionicons name="rocket" size={23} color="#E6ADFF" /></View>
          </View>

          <LinearGradient colors={['#48205F', '#291337']} style={styles.hero}>
            <View style={styles.heroHeading}>
              <Ionicons name="sparkles" color="#E7AEFF" size={20} />
              <Text style={styles.heroTitle}>Sua próxima conquista começa aqui</Text>
            </View>
            <Text style={styles.heroText}>Explore desafios reais, desenvolva suas habilidades e acompanhe suas inscrições.</Text>
          </LinearGradient>

          <View style={styles.metrics}>
            {[
              { icon: 'flash-outline' as const, valor: disponiveis, nome: 'Disponíveis' },
              { icon: 'document-text-outline' as const, valor: inscricoes.length, nome: 'Inscrições' },
              { icon: 'checkmark-circle-outline' as const, valor: aprovadas, nome: 'Aprovadas' },
            ].map(m => (
              <View key={m.nome} style={styles.metric}>
                <Ionicons name={m.icon} size={23} color={PURPLE} />
                <Text style={styles.metricValue}>{carregando ? '—' : m.valor}</Text>
                <Text style={styles.metricLabel}>{m.nome}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tabs}>
            {ABAS.map(item => (
              <TouchableOpacity key={item} onPress={() => { setAba(item); }}
                style={[styles.tab, aba === item && styles.tabActive]}>
                <Text style={[styles.tabText, aba === item && styles.tabTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" color="#B99BC9" size={20} />
            <TextInput value={busca} onChangeText={setBusca} placeholder={aba === 'Minhas inscrições' ? 'Buscar inscrição...' : 'Buscar desafios...'}
              placeholderTextColor="#9E8BAA" style={styles.searchInput} autoCapitalize="none" />
            {busca.length > 0 && <TouchableOpacity onPress={() => setBusca('')} accessibilityLabel="Limpar busca">
              <Ionicons name="close-circle" size={20} color="#B99BC9" />
            </TouchableOpacity>}
          </View>

          {!!erro && <View style={styles.error}><Ionicons name="alert-circle-outline" size={20} color="#FFACB8" />
            <Text style={styles.errorText}>{erro}</Text>
            <TouchableOpacity onPress={() => token && carregar(token)}><Text style={styles.retry}>Tentar novamente</Text></TouchableOpacity>
          </View>}

          {carregando ? <View style={styles.empty}><ActivityIndicator color={PURPLE} size="large" /><Text style={styles.emptyText}>Carregando dados...</Text></View>
            : aba === 'Minhas inscrições' ? (
              <>
                <Text style={styles.sectionTitle}>Minhas inscrições ({inscricoesVisiveis.length})</Text>
                {inscricoesVisiveis.length === 0 ? <View style={styles.empty}>
                  <Ionicons name="file-tray-outline" size={34} color={PURPLE} />
                  <Text style={styles.emptyTitle}>Nenhuma inscrição encontrada</Text>
                  <Text style={styles.emptyText}>Quando você se candidatar a um desafio, poderá acompanhar o resultado aqui.</Text>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => { setBusca(''); setAba('Explorar'); }}><Text style={styles.secondaryButtonText}>Explorar desafios</Text></TouchableOpacity>
                </View> : inscricoesVisiveis.map(inscricao => {
                  const st = situacao(inscricao.status);
                  const desafio = desafios.find(d => d.id === inscricao.challengeId);
                  return <View key={inscricao.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardIcon}><Ionicons name="document-text-outline" size={23} color="#E7ADFF" /></View>
                      <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{inscricao.challengeTitle}</Text><Text style={styles.muted}>Inscrição #{inscricao.id}</Text></View>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: st.fundo }]}>
                      <Ionicons name={st.icone} size={15} color={st.cor} /><Text style={[styles.statusText, { color: st.cor }]}>{st.texto}</Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.infoRow}><Text style={styles.muted}>Data da inscrição</Text><Text style={styles.infoValue}>{dataBR(inscricao.appliedAt)}</Text></View>
                    <Text style={styles.description}>{inscricao.status === 'PENDING' ? 'Sua candidatura foi recebida e aguarda análise.' : inscricao.status === 'APPROVED' ? 'Sua candidatura foi aprovada! Confira os detalhes do desafio.' : 'Sua candidatura não foi aprovada nesta análise.'}</Text>
                    {desafio && <TouchableOpacity onPress={() => router.push(`/desafios/${inscricao.challengeId}` as any)} style={styles.detailsToggle}>
                      <Text style={styles.detailsToggleText}>Ver detalhes do desafio</Text>
                      <Ionicons name="arrow-forward" size={17} color={PURPLE} />
                    </TouchableOpacity>}
                    <TouchableOpacity
                      style={styles.cancelButton}
                      activeOpacity={0.8}
                      disabled={cancelando !== null}
                      onPress={() => confirmarCancelamento(inscricao)}
                      accessibilityRole="button"
                      accessibilityLabel={`Cancelar inscrição no desafio ${inscricao.challengeTitle}`}
                    >
                      {cancelando === inscricao.id ? (
                        <ActivityIndicator color="#FFB1C2" size="small" />
                      ) : (
                        <Ionicons name="trash-outline" size={17} color="#FFB1C2" />
                      )}
                      <Text style={styles.cancelButtonText}>
                        {cancelando === inscricao.id ? 'Cancelando...' : 'Cancelar inscrição'}
                      </Text>
                    </TouchableOpacity>
                  </View>;
                })}
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>{aba === 'Disponíveis' ? 'Desafios disponíveis' : 'Explore os desafios'} ({desafiosVisiveis.length})</Text>
                {desafiosVisiveis.length === 0 ? <View style={styles.empty}>
                  <Ionicons name="rocket-outline" size={34} color={PURPLE} />
                  <Text style={styles.emptyTitle}>Nenhum desafio encontrado</Text>
                  <Text style={styles.emptyText}>Tente outra busca ou atualize os dados.</Text>
                </View> : desafiosVisiveis.map(desafio => {
                  const inscricao = inscricaoPorDesafio.get(desafio.id);
                  const aberto = desafioDisponivel(desafio);
                  return <View key={desafio.id} style={styles.card}>
                    <TouchableOpacity onPress={() => router.push(`/desafios/${desafio.id}` as any)} activeOpacity={0.8}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardIcon}><Ionicons name="code-slash-outline" size={23} color="#E7ADFF" /></View>
                        <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{desafio.title}</Text>
                          <Text style={styles.description} numberOfLines={2}>{desafio.description}</Text></View>
                        <Ionicons name="chevron-forward" size={18} color={PURPLE} />
                      </View>
                      <View style={styles.tagRow}>
                        <Text style={styles.tag}>{desafio.professionalArea || 'Área não informada'}</Text>
                        <Text style={styles.tag}>{nivel(desafio.difficulty)}</Text>
                        <Text style={[styles.tag, aberto ? styles.openTag : styles.closedTag]}>{aberto ? 'Aberto' : 'Indisponível'}</Text>
                      </View>
                      <View style={styles.infoRow}><Text style={styles.muted}><Ionicons name="calendar-outline" size={13} />  {dataBR(desafio.deadline)}</Text>
                        {inscricao && <Text style={styles.inscribed}>Inscrição: {situacao(inscricao.status).texto}</Text>}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.details}>
                      {inscricao ? (
                        <View style={styles.appliedBox}>
                          <Ionicons name="checkmark-circle-outline" color="#DCA0FF" size={19} />
                          <Text style={styles.appliedText}>Você já possui uma inscrição para este desafio. Acompanhe em Minhas inscrições.</Text>
                        </View>
                      ) : aberto ? (
                        <TouchableOpacity
                          disabled={enviando !== null}
                          activeOpacity={0.85}
                          onPress={() => confirmar('Confirmar inscrição', `Deseja candidatar-se ao desafio “${desafio.title}”?`, () => { void enviarInscricao(desafio); })}
                        >
                          <LinearGradient colors={['#9839D4', '#D15BFA']} style={styles.primaryButton}>
                            {enviando === desafio.id ? (
                              <ActivityIndicator color="#FFFFFF" />
                            ) : (
                              <>
                                <Ionicons name="paper-plane-outline" size={17} color="#FFFFFF" />
                                <Text style={styles.primaryButtonText}>Candidatar-me</Text>
                              </>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.unavailable}>Inscrições indisponíveis para este desafio.</Text>
                      )}
                    </View>
                  </View>;
                })}
              </>
            )}
        </View>
      </ScrollView>
      <BottomNav />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, scroll: { flex: 1 }, scrollContent: { paddingTop: 35, paddingHorizontal: 17, paddingBottom: 35, alignItems: 'center' },
  wrapper: { width: '100%', maxWidth: 540 }, topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22, gap: 12 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900' }, subtitle: { color: '#BDA7CC', fontSize: 12, marginTop: 5 },
  topIcon: { backgroundColor: '#422055', padding: 12, borderRadius: 14 },
  hero: { padding: 19, borderRadius: 19, borderWidth: 1, borderColor: '#67377F', marginBottom: 18 },
  heroHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 }, heroTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', flex: 1 },
  heroText: { color: '#D5BCE4', fontSize: 12, lineHeight: 19 },
  metrics: { flexDirection: 'row', gap: 9, marginBottom: 23 }, metric: { flex: 1, backgroundColor: '#281632', borderColor: '#4D305C', borderWidth: 1, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 3, alignItems: 'center', gap: 7 },
  metricValue: { color: '#FFF', fontSize: 23, fontWeight: '900' }, metricLabel: { color: '#C5ACD3', fontSize: 10, textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#281632', borderRadius: 13, padding: 4, marginBottom: 16, gap: 3 },
  tab: { flex: 1, paddingVertical: 11, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#8737BB' }, tabText: { color: '#C2AACC', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: '#FFF', fontWeight: '800' }, searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#25152F', borderColor: '#4D305E', borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, marginBottom: 22 },
  searchInput: { flex: 1, color: '#FFF', paddingVertical: 13, fontSize: 13, outlineStyle: 'none' } as any,
  sectionTitle: { color: '#FFF', fontSize: 17, fontWeight: '800', marginBottom: 14 },
  card: { backgroundColor: '#271632', borderWidth: 1, borderColor: '#59366B', borderRadius: 17, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 }, cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#502568', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', marginBottom: 5 }, description: { color: '#C7B1D3', fontSize: 12, lineHeight: 19, marginTop: 5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 15, marginBottom: 15 }, tag: { backgroundColor: '#482454', color: '#E1A9FF', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, fontSize: 10 },
  openTag: { backgroundColor: '#3F315C', color: '#E2B3FF' }, closedTag: { backgroundColor: '#45303C', color: '#E0B7C4' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  muted: { color: '#BFA9CF', fontSize: 11 }, infoValue: { color: '#FFF', fontSize: 12, fontWeight: '600' }, inscribed: { color: '#E1A4FF', fontSize: 11, fontWeight: '700' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8, marginTop: 14 }, statusText: { fontSize: 11, fontWeight: '800' },
  separator: { height: 1, backgroundColor: '#543361', marginTop: 15 },
  detailsToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 16 }, detailsToggleText: { color: PURPLE, fontSize: 12, fontWeight: '700' },
  details: { marginTop: 17, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#59366B' }, detailLabel: { color: '#E5AEFF', fontSize: 12, fontWeight: '800', marginBottom: 5 }, detailText: { color: '#D0BBDC', fontSize: 12, lineHeight: 19, marginBottom: 14 },
  primaryButton: { flexDirection: 'row', gap: 9, justifyContent: 'center', alignItems: 'center', borderRadius: 12, paddingVertical: 15, marginTop: 5 }, primaryButtonText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  appliedBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#3A2449', borderRadius: 11, padding: 12 }, appliedText: { flex: 1, color: '#DAB7EB', fontSize: 12, lineHeight: 18 },
  unavailable: { color: '#C8ACBD', fontSize: 12, marginTop: 7 },
  cancelButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#96516A', borderRadius: 11, paddingVertical: 12, marginTop: 14 },
  cancelButtonText: { color: '#FFB1C2', fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#25152F', borderWidth: 1, borderColor: '#543265', borderRadius: 17, padding: 28, gap: 12 },
  emptyTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', textAlign: 'center' }, emptyText: { color: '#C5B1D2', fontSize: 12, lineHeight: 19, textAlign: 'center' },
  secondaryButton: { borderWidth: 1, borderColor: '#8F4BB0', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 15, marginTop: 5 }, secondaryButtonText: { color: '#E6B4FF', fontSize: 12, fontWeight: '700' },
  error: { backgroundColor: '#422334', borderRadius: 12, padding: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14 }, errorText: { color: '#FFAFBC', fontSize: 12, flex: 1 }, retry: { color: '#FFF', fontSize: 12, fontWeight: '800' },
});
