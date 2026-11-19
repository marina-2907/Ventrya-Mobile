
import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

type Documento = {
  nome: string;
  uri: string;
  tipo: string;
  tamanho: number | null;
};

type Props = {
  chavePerfil: string | null;
};

const LIMITE_BYTES = 10 * 1024 * 1024;

const TIPOS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function formato(nome: string): string {
  return nome.split('.').pop()?.toLowerCase() || '';
}

function mime(ext: string): string {
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    default:
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
}

function tamanhoLegivel(n: number | null): string {
  if (n == null) return 'Tamanho não informado';

  return n < 1024 * 1024
    ? `${Math.ceil(n / 1024)} KB`
    : `${(n / 1024 / 1024).toFixed(1)} MB`;
}

async function lerMeta(chave: string) {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(chave);
}

async function salvarMeta(
  chave: string,
  doc: Documento
) {
  await SecureStore.setItemAsync(
    chave,
    JSON.stringify(doc)
  );
}

export default function CurriculoOriginal({
  chavePerfil,
}: Props) {
  const [documento, setDocumento] =
    useState<Documento | null>(null);

  const [arquivoWeb, setArquivoWeb] =
    useState<File | null>(null);

  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const chaveDocumento = chavePerfil
    ? `${chavePerfil}_curriculo_original`
    : null;

  // Recuperar documento previamente salvo.
  useEffect(() => {
    let ativo = true;

    setDocumento(null);
    setArquivoWeb(null);
    setMensagem('');

    async function carregar() {
      if (
        !chaveDocumento ||
        Platform.OS === 'web'
      ) {
        return;
      }

      try {
        const salvo =
          await lerMeta(chaveDocumento);

        if (!salvo) return;

        const doc =
          JSON.parse(salvo) as Documento;

        if (!doc?.uri || !doc?.nome) return;

        const info =
          await FileSystem.getInfoAsync(doc.uri);

        if (info.exists && ativo) {
          setDocumento(doc);
        }
      } catch {
        if (ativo) {
          setMensagem(
            'Não foi possível recuperar o documento salvo.'
          );
        }
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [chaveDocumento]);

  // Escolher PDF ou Word.
  async function selecionar() {
    if (!chaveDocumento || ocupado) return;

    setOcupado(true);
    setMensagem('');

    try {
      const resposta =
        await DocumentPicker.getDocumentAsync({
          type: TIPOS,
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (
        resposta.canceled ||
        !resposta.assets.length
      ) {
        return;
      }

      const asset = resposta.assets[0];
      const ext = formato(asset.name);

      if (!['pdf', 'doc', 'docx'].includes(ext)) {
        setMensagem(
          'Escolha um arquivo PDF, DOC ou DOCX.'
        );
        return;
      }

      if (
        typeof asset.size === 'number' &&
        asset.size > LIMITE_BYTES
      ) {
        setMensagem(
          'O arquivo deve ter no máximo 10 MB.'
        );
        return;
      }

      // No navegador, mantém o arquivo
      // disponível durante a sessão atual.
      if (Platform.OS === 'web') {
        if (!asset.file) {
          setMensagem(
            'O navegador não disponibilizou o arquivo.'
          );
          return;
        }

        setArquivoWeb(asset.file);

        setDocumento({
          nome: asset.name,
          uri: '',
          tipo: mime(ext),
          tamanho: asset.size ?? null,
        });

        setMensagem(
          'Arquivo selecionado nesta sessão. Não foi enviado à API.'
        );
        return;
      }

      // No Android e iOS, copia o documento
      // para uma pasta privada do aplicativo.
      if (!FileSystem.documentDirectory) {
        setMensagem(
          'O armazenamento local está indisponível.'
        );
        return;
      }

      const pasta =
        `${FileSystem.documentDirectory}ventrya-curriculos/`;

      await FileSystem.makeDirectoryAsync(
        pasta,
        { intermediates: true }
      );

      const idSeguro = chaveDocumento
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(-75);

      const destino =
        `${pasta}${idSeguro}_${Date.now()}.${ext}`;

      await FileSystem.copyAsync({
        from: asset.uri,
        to: destino,
      });

      const novo: Documento = {
        nome: asset.name,
        uri: destino,
        tipo: mime(ext),
        tamanho: asset.size ?? null,
      };

      await SecureStore.setItemAsync(
        chaveDocumento,
        JSON.stringify(novo)
      );

      const anterior = documento;

      setDocumento(novo);
      setMensagem(
        'Currículo anexado neste dispositivo.'
      );

      // Remove a cópia antiga após
      // registrar a nova com sucesso.
      if (
        anterior?.uri &&
        anterior.uri !== destino
      ) {
        await FileSystem.deleteAsync(
          anterior.uri,
          { idempotent: true }
        ).catch(() => undefined);
      }

    } catch {
      setMensagem(
        'Não foi possível anexar o arquivo. Tente novamente.'
      );
    } finally {
      setOcupado(false);
    }
  }

  // Abrir ou compartilhar.
  async function abrir() {
    if (!documento || ocupado) return;

    setMensagem('');

    try {
      if (Platform.OS === 'web') {
        if (!arquivoWeb) {
          setMensagem(
            'Selecione novamente o arquivo para abri-lo.'
          );
          return;
        }

        const url =
          URL.createObjectURL(arquivoWeb);

        const janela = window.open(
          url,
          '_blank'
        );

        if (!janela) {
          setMensagem(
            'Permita pop-ups para abrir o documento.'
          );
        }

        setTimeout(
          () => URL.revokeObjectURL(url),
          60000
        );

      } else {
        const disponivel =
          await Sharing.isAvailableAsync();

        if (!disponivel) {
          setMensagem(
            'Não há aplicativo disponível para abrir ou compartilhar.'
          );
          return;
        }

        await Sharing.shareAsync(
          documento.uri,
          {
            mimeType: documento.tipo,
            dialogTitle:
              'Abrir ou compartilhar currículo',
          }
        );
      }
    } catch {
      setMensagem(
        'Não foi possível abrir o documento.'
      );
    }
  }

  // Remover arquivo local.
  async function remover() {
    if (
      !chaveDocumento ||
      !documento ||
      ocupado
    ) {
      return;
    }

    setOcupado(true);

    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(
          chaveDocumento
        );

        if (documento.uri) {
          await FileSystem.deleteAsync(
            documento.uri,
            { idempotent: true }
          );
        }
      }

      setDocumento(null);
      setArquivoWeb(null);

      setMensagem(
        'Documento removido deste dispositivo.'
      );

    } catch {
      setMensagem(
        'Não foi possível remover o documento.'
      );
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View style={styles.cartao}>
      <View style={styles.cabecalho}>
        <View style={styles.icone}>
          <Ionicons
            name="document-attach-outline"
            color="#E5B6FF"
            size={24}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>
            Currículo original
          </Text>

          <Text style={styles.descricao}>
            Anexe seu currículo em PDF ou Word.
          </Text>
        </View>
      </View>

      {documento ? (
        <View style={styles.arquivo}>
          <Ionicons
            name="document-text-outline"
            color="#DFA4FF"
            size={30}
          />

          <View style={{ flex: 1 }}>
            <Text
              style={styles.nomeArquivo}
              numberOfLines={2}
            >
              {documento.nome}
            </Text>

            <Text style={styles.detalhe}>
              {formato(documento.nome).toUpperCase()}
              {' • '}
              {tamanhoLegivel(documento.tamanho)}
            </Text>

            <Text style={styles.estado}>
              Disponível neste dispositivo
            </Text>
          </View>

          <Ionicons
            name="checkmark-circle"
            color="#97EBC0"
            size={21}
          />
        </View>
      ) : (
        <View style={styles.vazio}>
          <Ionicons
            name="cloud-upload-outline"
            color="#DDA5F5"
            size={31}
          />

          <Text style={styles.vazioTitulo}>
            Nenhum arquivo anexado
          </Text>

          <Text style={styles.vazioTexto}>
            PDF, DOC ou DOCX • até 10 MB
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => {
          void selecionar();
        }}
        disabled={ocupado || !chavePerfil}
        style={[
          styles.botao,
          ocupado && { opacity: 0.6 },
        ]}
        accessibilityRole="button"
      >
        {ocupado ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Ionicons
            name="attach-outline"
            color="#FFFFFF"
            size={19}
          />
        )}

        <Text style={styles.botaoTexto}>
          {documento
            ? 'Substituir arquivo'
            : 'Escolher arquivo do currículo'}
        </Text>
      </TouchableOpacity>

      {documento && (
        <View style={styles.acoes}>
          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={() => {
              void abrir();
            }}
          >
            <Ionicons
              name="open-outline"
              color="#F0D6FF"
              size={17}
            />

            <Text style={styles.textoSecundario}>
              Abrir / compartilhar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={() => {
              void remover();
            }}
            disabled={ocupado}
          >
            <Ionicons
              name="trash-outline"
              color="#F6B4C2"
              size={17}
            />

            <Text
              style={[
                styles.textoSecundario,
                { color: '#F6B4C2' },
              ]}
            >
              Remover
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!!mensagem && (
        <Text style={styles.aviso}>
          {mensagem}
        </Text>
      )}

      <View style={styles.info}>
        <Ionicons
          name="lock-closed-outline"
          color="#BDA6CF"
          size={16}
        />

        <Text style={styles.infoTexto}>
          O documento fica neste dispositivo.
          Para contratantes acessarem pelo Ventrya,
          será necessária uma integração de upload
          e permissões na API.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: '#24132F',
    borderWidth: 1,
    borderColor: '#5C3670',
    borderRadius: 19,
    padding: 18,
    marginBottom: 15,
  },

  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  icone: {
    backgroundColor: '#45245A',
    borderRadius: 12,
    height: 46,
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titulo: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
  },

  descricao: {
    color: '#BFA8CD',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  vazio: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#7D4E91',
    backgroundColor: '#2C1939',
    borderRadius: 15,
    alignItems: 'center',
    padding: 23,
    gap: 7,
  },

  vazioTitulo: {
    color: '#F6E7FF',
    fontWeight: '800',
    fontSize: 13,
  },

  vazioTexto: {
    color: '#BBA5CC',
    fontSize: 11,
  },

  arquivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#301B3D',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#64437C',
  },

  nomeArquivo: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  detalhe: {
    color: '#C5B1D2',
    fontSize: 11,
    marginTop: 4,
  },

  estado: {
    color: '#97EBC0',
    fontSize: 11,
    marginTop: 6,
  },

  botao: {
    marginTop: 14,
    backgroundColor: '#8738B8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  acoes: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 9,
    flexWrap: 'wrap',
  },

  botaoSecundario: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: '#65437D',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  textoSecundario: {
    color: '#F0D6FF',
    fontSize: 12,
    fontWeight: '700',
  },

  aviso: {
    color: '#E8BEFF',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 11,
  },

  info: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    alignItems: 'flex-start',
  },

  infoTexto: {
    color: '#B5A1C5',
    fontSize: 10,
    lineHeight: 16,
    flex: 1,
  },
});
