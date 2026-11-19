import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { api } from '../services/api';
import BottomNav from '../components/BottomNav';

type Application = {
  id: number;
  challengeId: number;
  challengeTitle: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
};
type Submission = {
  id: number;
  applicationId: number;
  description: string;
  fileUrl: string | null;
  status: string;
  submittedAt: string;
};
type Feedback = {
  id: number;
  submissionId: number;
  comment: string | null;
  rating: number | null;
  strengths: string | null;
  improvements: string | null;
  createdAt: string;
};
type Page<T> = { content: T[]; totalPages: number; last: boolean };
type EvaluationItem = {
  application: Application;
  submission?: Submission;
  feedback?: Feedback;
  error?: string;
};
const PURPLE = '#D66BFF';

async function getToken(): Promise<string | null> {
  return Platform.OS === 'web'
    ? window.sessionStorage.getItem('ventrya_token')
    : SecureStore.getItemAsync('ventrya_token');
}
async function logout() {
  if (Platform.OS === 'web') {
    window.sessionStorage.removeItem('ventrya_token');
    window.sessionStorage.removeItem('ventrya_user');
  } else {
    await SecureStore.deleteItemAsync('ventrya_token');
    await SecureStore.deleteItemAsync('ventrya_user');
  }
  router.replace('/login');
}
async function getAllApplications(jwt: string): Promise<Application[]> {
  const items: Application[] = [];
  for (let page = 0; page < 100; page++) {
    const { data } = await api.get<Page<Application>>('/api/applications/me', {
      params: { page, size: 50 },
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!Array.isArray(data.content)) throw new Error('Formato de resposta inválido.');
    items.push(...data.content);
    if (data.last === true || page + 1 >= data.totalPages) return items;
  }
  throw new Error('Limite de páginas excedido.');
}
function dateBR(date?: string | null) {
  if (!date) return 'Não informada';
  const [year, month, day] = date.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : date;
}
function isNotFound(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
function Stars({ rating }: { rating: number | null }) {
  const valid = typeof rating === 'number' && Number.isFinite(rating) && rating >= 0 && rating <= 5;
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={valid && rating! >= star ? 'star' : valid && rating! >= star - 0.5 ? 'star-half' : 'star-outline'}
          color={valid ? '#E8A6FF' : '#857293'}
          size={22}
        />
      ))}
      <Text style={styles.ratingText}>{valid ? `${rating}/5` : rating == null ? 'Sem nota' : `Nota: ${rating}`}</Text>
    </View>
  );
}
function FeedbackSection({ icon, title, content, color }: {
  icon: React.ComponentProps<typeof Ionicons>['name']; title: string;
  content: string | null; color: string;
}) {
  if (!content?.trim()) return null;
  return (
    <View style={styles.feedbackRow}>
      <Ionicons name={icon} color={color} size={21} />
      <View style={{ flex: 1 }}>
        <Text style={styles.feedbackTitle}>{title}</Text>
        <Text style={styles.feedbackText}>{content}</Text>
      </View>
    </View>
  );
}

export default function AvaliacoesScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (jwt: string, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const applications = await getAllApplications(jwt);
      // Consultas em pequenos grupos para não sobrecarregar a API.
      const result: EvaluationItem[] = [];
      for (let offset = 0; offset < applications.length; offset += 5) {
        const batch = applications.slice(offset, offset + 5);
        const resolved = await Promise.all(batch.map(async (application): Promise<EvaluationItem> => {
          try {
            const { data: submission } = await api.get<Submission>(
              `/api/submissions/application/${application.id}`,
              { headers: { Authorization: `Bearer ${jwt}` } },
            );
            try {
              const { data: feedback } = await api.get<Feedback>(
                `/api/feedbacks/submission/${submission.id}`,
                { headers: { Authorization: `Bearer ${jwt}` } },
              );
              return { application, submission, feedback };
            } catch (e) {
              if (isUnauthorized(e)) throw e;
              if (isNotFound(e)) return { application, submission };
              return { application, submission, error: 'Não foi possível consultar o feedback.' };
            }
          } catch (e) {
            if (isUnauthorized(e)) throw e;
            if (isNotFound(e)) return { application };
            return { application, error: 'Não foi possível consultar a entrega.' };
          }
        }));
        result.push(...resolved);
      }
      result.sort((a, b) => (b.submission?.submittedAt || b.application.appliedAt || '')
        .localeCompare(a.submission?.submittedAt || a.application.appliedAt || ''));
      setItems(result);
    } catch (e) {
      if (isUnauthorized(e)) {
        await logout();
        return;
      }
      setError('Não foi possível carregar as avaliações. Verifique sua conexão e se a API Java está ligada.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const jwt = await getToken();
        if (!jwt) { router.replace('/login'); return; }
        if (!mounted) return;
        setToken(jwt);
        await load(jwt);
      } catch {
        if (mounted) {
          setError('Não foi possível recuperar sua sessão.');
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [load]);

  const evaluated = items.filter(item => !!item.feedback).length;
  const pending = items.filter(item => !!item.submission && !item.feedback && !item.error).length;

  return (
    <LinearGradient colors={['#090410', '#150820', '#1D0B2A']} style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={PURPLE} onRefresh={() => { if (token) void load(token, true); }} />}
      >
        <View style={styles.wrapper}>
          <View style={styles.heading}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Minhas Avaliações</Text>
              <Text style={styles.subtitle}>Acompanhe os feedbacks das suas entregas.</Text>
            </View>
            <View style={styles.headingIcon}><Ionicons name="ribbon" color="#E6ADFF" size={24} /></View>
          </View>

          <LinearGradient colors={['#48205F', '#291337']} style={styles.hero}>
            <View style={styles.heroTitleRow}>
              <Ionicons name="sparkles" color="#E7AEFF" size={21} />
              <Text style={styles.heroTitle}>Sua evolução em cada desafio</Text>
            </View>
            <Text style={styles.heroText}>Confira suas avaliações geradas pela IA e descubra como aprimorar suas habilidades.</Text>
          </LinearGradient>

          <View style={styles.metrics}>
            <View style={styles.metric}><Ionicons name="document-text-outline" color={PURPLE} size={22} /><Text style={styles.metricValue}>{loading ? '—' : items.filter(i => !!i.submission).length}</Text><Text style={styles.metricLabel}>Entregas</Text></View>
            <View style={styles.metric}><Ionicons name="star-outline" color={PURPLE} size={22} /><Text style={styles.metricValue}>{loading ? '—' : evaluated}</Text><Text style={styles.metricLabel}>Avaliadas</Text></View>
            <View style={styles.metric}><Ionicons name="time-outline" color={PURPLE} size={22} /><Text style={styles.metricValue}>{loading ? '—' : pending}</Text><Text style={styles.metricLabel}>Aguardando IA</Text></View>
          </View>

          {error ? (
            <View style={styles.empty}>
              <Ionicons name="alert-circle-outline" color="#FFACB8" size={32} />
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => { if (token) void load(token); }}><Text style={styles.secondaryText}>Tentar novamente</Text></TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.empty}><ActivityIndicator size="large" color={PURPLE} /><Text style={styles.emptyText}>Buscando suas avaliações...</Text></View>
          ) : items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="ribbon-outline" color={PURPLE} size={38} />
              <Text style={styles.emptyTitle}>Nenhuma avaliação por enquanto</Text>
              <Text style={styles.emptyText}>Participe de um desafio e envie sua solução para receber um feedback da IA.</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/desafios' as any)}><Text style={styles.secondaryText}>Explorar desafios</Text></TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Histórico de desafios ({items.length})</Text>
              {items.map(({ application, submission, feedback, error: itemError }) => (
                <View key={application.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}><Ionicons name="code-slash-outline" color="#E7ADFF" size={23} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{application.challengeTitle || `Desafio #${application.challengeId}`}</Text>
                      <Text style={styles.muted}>Inscrição #{application.id}</Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  {itemError ? (
                    <View style={styles.statusRow}><Ionicons name="alert-circle-outline" color="#FFACB8" size={18} /><Text style={styles.errorText}>{itemError}</Text></View>
                  ) : !submission ? (
                    <View style={styles.statusRow}><Ionicons name="document-text-outline" color="#C7B1D3" size={18} /><Text style={styles.muted}>Ainda não há uma entrega registrada para esta inscrição.</Text></View>
                  ) : !feedback ? (
                    <>
                      <View style={styles.statusRow}><Ionicons name="hourglass-outline" color="#E6ADFF" size={19} /><Text style={styles.pendingText}>Aguardando avaliação da IA</Text></View>
                      <Text style={styles.muted}>Entrega enviada em {dateBR(submission.submittedAt)}</Text>
                      <Text style={styles.feedbackText}>O feedback pode levar algum tempo para ser processado. Puxe a tela para baixo para atualizar.</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>Nota recebida</Text>
                      <Stars rating={feedback.rating} />
                      <Text style={styles.muted}>Avaliado em {dateBR(feedback.createdAt)}</Text>
                      <View style={styles.divider} />
                      <FeedbackSection icon="chatbubble-ellipses-outline" title="Feedback da IA" content={feedback.comment} color="#DCA0FF" />
                      <FeedbackSection icon="checkmark-circle-outline" title="Pontos fortes" content={feedback.strengths} color="#A6E7BC" />
                      <FeedbackSection icon="bulb-outline" title="Oportunidades de melhoria" content={feedback.improvements} color="#F5D18C" />
                    </>
                  )}
                  <TouchableOpacity style={styles.detailsLink} onPress={() => router.push(`/desafios/${application.challengeId}` as any)}>
                    <Text style={styles.detailsText}>Ver desafio</Text><Ionicons name="arrow-forward" size={17} color={PURPLE} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
      <BottomNav />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingTop: 35, paddingHorizontal: 17, paddingBottom: 35, alignItems: 'center' },
  wrapper: { width: '100%', maxWidth: 540 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#BDA7CC', fontSize: 12, marginTop: 5 },
  headingIcon: { backgroundColor: '#422055', padding: 12, borderRadius: 14 },
  hero: { padding: 19, borderRadius: 19, borderWidth: 1, borderColor: '#67377F', marginBottom: 18 },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
  heroTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', flex: 1 },
  heroText: { color: '#D5BCE4', fontSize: 12, lineHeight: 19 },
  metrics: { flexDirection: 'row', gap: 9, marginBottom: 23 },
  metric: { flex: 1, backgroundColor: '#281632', borderColor: '#4D305C', borderWidth: 1, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 3, alignItems: 'center', gap: 7 },
  metricValue: { color: '#FFF', fontSize: 23, fontWeight: '900' },
  metricLabel: { color: '#C5ACD3', fontSize: 10, textAlign: 'center' },
  sectionTitle: { color: '#FFF', fontSize: 17, fontWeight: '800', marginBottom: 14 },
  card: { backgroundColor: '#271632', borderWidth: 1, borderColor: '#59366B', borderRadius: 17, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#502568', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', marginBottom: 5 },
  muted: { color: '#BFA9CF', fontSize: 11, lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#543361', marginVertical: 15 },
  label: { color: '#CDB6DC', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  stars: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
  ratingText: { color: '#E8A6FF', fontSize: 16, fontWeight: '800', marginLeft: 8 },
  feedbackRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 18 },
  feedbackTitle: { color: '#FFF', fontSize: 13, fontWeight: '800', marginBottom: 5 },
  feedbackText: { color: '#C7B1D3', fontSize: 12, lineHeight: 19, marginTop: 7 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 9 },
  pendingText: { color: '#E8B7FF', fontSize: 12, fontWeight: '800', flex: 1 },
  errorText: { color: '#FFACB8', fontSize: 12, flex: 1 },
  detailsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 7, marginTop: 18 },
  detailsText: { color: PURPLE, fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#25152F', borderWidth: 1, borderColor: '#543265', borderRadius: 17, padding: 28, gap: 12 },
  emptyTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: '#C5B1D2', fontSize: 12, lineHeight: 19, textAlign: 'center' },
  secondaryButton: { borderWidth: 1, borderColor: '#8F4BB0', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 15, marginTop: 5 },
  secondaryText: { color: '#E6B4FF', fontSize: 12, fontWeight: '700' },
});
