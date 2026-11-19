
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { api } from '../services/api';
import BottomNav from '../components/BottomNav';

type Mensagem = {
  id: string;
  autor: 'ia' | 'usuario';
  texto: string;
};

const sugestoes = [
  'Me ajude a montar meu currículo',
  'Simule uma entrevista de emprego',
  'Como me preparar para minha primeira vaga?',
  'Quais habilidades devo desenvolver?',
];

export default function IaScreen() {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: 'boas-vindas',
      autor: 'ia',
      texto:
        'Olá! Eu sou a Ventrya IA. 💜\n\n' +
        'Estou aqui para ajudar você com sua carreira, ' +
        'currículo, entrevistas, estudos e preparação para o mercado de trabalho.\n\n' +
        'Como posso ajudar hoje?',
    },
  ]);

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  async function obterToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined'
        ? window.sessionStorage.getItem('ventrya_token')
        : null;
    }

    return SecureStore.getItemAsync('ventrya_token');
  }

  async function enviar(sugestao?: string) {
    const pergunta = (sugestao ?? texto).trim();

    if (!pergunta || enviando) return;

    if (pergunta.length > 1500) {
      setMensagens((atual) => [
        ...atual,
        {
          id: `${Date.now()}-limite`,
          autor: 'ia',
          texto: 'Envie uma mensagem com até 1500 caracteres.',
        },
      ]);
      return;
    }

    const token = await obterToken();

    if (!token) {
      router.replace('/login');
      return;
    }

    setTexto('');
    setEnviando(true);

    setMensagens((atual) => [
      ...atual,
      {
        id: `${Date.now()}-usuario`,
        autor: 'usuario',
        texto: pergunta,
      },
    ]);

    try {
      const resultado = await api.post<{ resposta: string }>(
        '/api/ia/chat',
        { mensagem: pergunta },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 120000,
        }
      );

      const resposta = resultado.data?.resposta?.trim();

      setMensagens((atual) => [
        ...atual,
        {
          id: `${Date.now()}-resposta`,
          autor: 'ia',
          texto: resposta || 'Não consegui gerar uma resposta.',
        },
      ]);
    } catch (erro: any) {
      const status: number | undefined = erro?.response?.status;
      const codigo: string | undefined = erro?.code;

      // Diagnóstico sem registrar token, senha ou conteúdo da mensagem.
      console.error('Ventrya IA - Falha na requisição', {
        status: status ?? 'sem resposta HTTP',
        codigo: codigo ?? 'não informado',
        rota: '/api/ia/chat',
      });

      let mensagemErro: string;

      if (status === 401) {
        mensagemErro =
          'Erro 401: a API recusou sua autenticação. ' +
          'Precisamos verificar o token salvo no login e a validação JWT do Java.';
      } else if (status === 403) {
        mensagemErro =
          'Erro 403: o servidor bloqueou o acesso ao chat. ' +
          'Precisamos conferir as permissões da rota /api/ia/chat no Spring Security.';
      } else if (status === 404) {
        mensagemErro =
          'Erro 404: o endereço /api/ia/chat não foi encontrado. ' +
          'Confira se o AiController está ativo e a URL da API está correta.';
      } else if (status === 429) {
        mensagemErro =
          'Muitas solicitações em sequência. Tente novamente daqui a pouco.';
      } else if (status && status >= 500) {
        mensagemErro =
          `Erro ${status}: a API teve um problema ao gerar a resposta. ` +
          'Confira o terminal Java e a conexão com o Ollama.';
      } else if (codigo === 'ECONNABORTED' || codigo === 'ETIMEDOUT') {
        mensagemErro =
          'A resposta demorou mais que o esperado. ' +
          'Verifique se o Ollama está executando o modelo qwen2.5:3b.';
      } else if (!erro?.response) {
        mensagemErro =
          'Não foi possível acessar a API Java. ' +
          'Confira o endereço configurado em services/api.ts e a porta 8080.';
      } else {
        mensagemErro =
          'Não foi possível concluir a conversa. ' +
          `Código HTTP: ${status ?? 'desconhecido'}.`;
      }

      setMensagens((atual) => [
        ...atual,
        {
          id: `${Date.now()}-erro`,
          autor: 'ia',
          texto: mensagemErro,
        },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.conteudo}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.cabecalho}>
          <View style={styles.iconeIA}>
            <Ionicons name="sparkles" size={24} color="#E4C5FF" />
          </View>

          <View style={styles.cabecalhoTexto}>
            <Text style={styles.titulo}>Ventrya IA</Text>
            <Text style={styles.subtitulo}>
              Sua parceira de carreira
            </Text>
          </View>

          <View style={styles.status}>
            <View style={styles.pontoStatus} />
            <Text style={styles.statusTexto}>IA</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          contentContainerStyle={styles.chatConteudo}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {mensagens.map((mensagem) => {
            const usuario = mensagem.autor === 'usuario';

            return (
              <View
                key={mensagem.id}
                style={[
                  styles.linhaMensagem,
                  usuario
                    ? styles.linhaUsuario
                    : styles.linhaIA,
                ]}
              >
                {!usuario && (
                  <View style={styles.avatarIA}>
                    <Ionicons
                      name="sparkles"
                      size={15}
                      color="#D6ABFF"
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.balao,
                    usuario
                      ? styles.balaoUsuario
                      : styles.balaoIA,
                  ]}
                >
                  <Text style={styles.textoMensagem}>
                    {mensagem.texto}
                  </Text>
                </View>
              </View>
            );
          })}

          {mensagens.length === 1 && (
            <View style={styles.sugestoes}>
              <Text style={styles.sugestoesTitulo}>
                Experimente perguntar
              </Text>

              {sugestoes.map((sugestao) => (
                <Pressable
                  key={sugestao}
                  style={styles.sugestao}
                  onPress={() => enviar(sugestao)}
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={17}
                    color="#C9A4FF"
                  />

                  <Text style={styles.sugestaoTexto}>
                    {sugestao}
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color="#9477AC"
                  />
                </Pressable>
              ))}
            </View>
          )}

          {enviando && (
            <View style={styles.digitando}>
              <ActivityIndicator
                size="small"
                color="#C8A2FF"
              />
              <Text style={styles.digitandoTexto}>
                Ventrya está pensando...
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.areaEnvio}>
          <View style={styles.campo}>
            <TextInput
              style={styles.input}
              value={texto}
              onChangeText={setTexto}
              placeholder="Pergunte alguma coisa..."
              placeholderTextColor="#86758F"
              multiline
              maxLength={1500}
              editable={!enviando}
            />

            <Pressable
              style={[
                styles.botaoEnviar,
                (!texto.trim() || enviando) &&
                  styles.botaoDesativado,
              ]}
              onPress={() => enviar()}
              disabled={!texto.trim() || enviando}
            >
              <Ionicons
                name="arrow-up"
                size={21}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          <Text style={styles.aviso}>
            A IA pode cometer erros. Confira informações importantes.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#120B1B',
  },
  conteudo: {
    flex: 1,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#30213E',
    backgroundColor: '#1B1028',
  },
  iconeIA: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: '#412659',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cabecalhoTexto: {
    flex: 1,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },
  subtitulo: {
    color: '#B9A7C5',
    fontSize: 12,
    marginTop: 3,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pontoStatus: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#B69BEA',
  },
  statusTexto: {
    color: '#C4AED7',
    fontSize: 12,
  },
  chat: {
    flex: 1,
  },
  chatConteudo: {
    padding: 17,
    paddingBottom: 25,
  },
  linhaMensagem: {
    flexDirection: 'row',
    marginBottom: 17,
    alignItems: 'flex-end',
  },
  linhaIA: {
    justifyContent: 'flex-start',
  },
  linhaUsuario: {
    justifyContent: 'flex-end',
  },
  avatarIA: {
    width: 29,
    height: 29,
    borderRadius: 11,
    backgroundColor: '#332044',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  balao: {
    maxWidth: '82%',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 17,
  },
  balaoIA: {
    backgroundColor: '#281A37',
    borderBottomLeftRadius: 5,
  },
  balaoUsuario: {
    backgroundColor: '#7541A8',
    borderBottomRightRadius: 5,
  },
  textoMensagem: {
    color: '#F7F0FC',
    fontSize: 14,
    lineHeight: 21,
  },
  sugestoes: {
    marginTop: 11,
    marginLeft: 37,
    gap: 9,
  },
  sugestoesTitulo: {
    color: '#AFA0BB',
    fontSize: 12,
    marginBottom: 4,
  },
  sugestao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#483055',
    borderRadius: 13,
    backgroundColor: '#20142D',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  sugestaoTexto: {
    color: '#E5D6F0',
    fontSize: 12,
    flex: 1,
  },
  digitando: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 38,
    gap: 9,
    paddingVertical: 10,
  },
  digitandoTexto: {
    color: '#BBA6CE',
    fontSize: 12,
  },
  areaEnvio: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#30213E',
    backgroundColor: '#1B1028',
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#2A1C37',
    borderWidth: 1,
    borderColor: '#50365E',
    borderRadius: 20,
    padding: 7,
    paddingLeft: 15,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 110,
    minHeight: 35,
    paddingVertical: 8,
    textAlignVertical: 'center',
  },
  botaoEnviar: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: '#9256C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },
  botaoDesativado: {
    opacity: 0.45,
  },
  aviso: {
    color: '#8E7E9C',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 9,
  },
});
