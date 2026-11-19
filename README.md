# Ventrya — Mobile

### Global Solution 2026/2 | FIAP — Análise e Desenvolvimento de Sistemas

**Seu potencial merece uma oportunidade.**

O **Ventrya** é um aplicativo voltado a pessoas em início de carreira, especialmente aquelas com pouca ou nenhuma experiência profissional. Sua proposta é ampliar as oportunidades de demonstrar competências por meio de **desafios práticos, projetos, atividades de raciocínio e acompanhamento de candidaturas**, complementando as informações de um currículo tradicional.

> **Projeto acadêmico:** MVP desenvolvido para a Global Solution 2026/2 da FIAP. Algumas funcionalidades dependem da API Java em execução; outras armazenam informações localmente no dispositivo.

---

## 1. Problema e proposta

A exigência de experiência profissional pode dificultar o acesso ao primeiro emprego. O Ventrya foi pensado para ajudar o candidato a **aprender, praticar e mostrar seu potencial**, oferecendo recursos para:

- Construir sua identidade e seu perfil profissional;
- Consultar oportunidades e inscrever-se em desafios práticos;
- Enviar projetos para demonstrar conhecimentos e habilidades;
- Acompanhar inscrições, entregas e avaliações;
- Exercitar competências na **Arena Ventrya**;
- Buscar orientações sobre preparação profissional no **Ventrya IA**, quando o serviço estiver disponível.

A proposta está alinhada aos Objetivos de Desenvolvimento Sustentável (ODS): **ODS 4 — Educação de Qualidade**, **ODS 8 — Trabalho Decente e Crescimento Econômico** e **ODS 10 — Redução das Desigualdades**.

## 2. Funcionalidades do aplicativo

| Módulo | Funcionalidades |
|---|---|
| **Cadastro e login** | Criação de conta, validação de campos, autenticação com a API Java e sessão do usuário |
| **Painel** | Visão geral da jornada, indicadores de candidaturas e acesso aos desafios |
| **Meu Perfil** | Currículo resumido, objetivo profissional, formação, experiências, habilidades e contatos |
| **Avatar Ventrya** | Criação e personalização de personagem, sem avatar pré-definido para contas novas |
| **Currículo original** | Seleção de PDF, DOC ou DOCX; armazenamento local, abertura/compartilhamento, substituição e remoção |
| **Desafios** | Consulta de oportunidades, inscrição e acompanhamento de etapas |
| **Entregas** | Envio de projetos/soluções e tratamento de situações como entrega já realizada |
| **Avaliações** | Visualização e acompanhamento das avaliações e entregas disponíveis |
| **Arena Ventrya** | Sete atividades com registro local dos melhores resultados por usuário |
| **Ventrya IA** | Assistência relacionada à preparação profissional, condicionada à disponibilidade do serviço configurado |

### Arena Ventrya

A Arena conta com sete atividades:

1. Sequência Lógica;
2. Sudoku Mestre;
3. Labirinto Estratégico;
4. Memória Tech;
5. Teste de Inglês;
6. Teste de Português;
7. Teste de Matemática.

Cada atividade permite obter até **100 pontos**, totalizando até **700 pontos** na soma dos melhores resultados. Nesta versão, os recordes ficam salvos **localmente por usuário** e não constituem, por si só, uma classificação oficial de recrutadores.

## 3. Tecnologias e arquitetura

| Camada | Tecnologias |
|---|---|
| **Mobile** | React Native, Expo e TypeScript |
| **Navegação** | Expo Router |
| **Interface** | Expo Linear Gradient, Ionicons e React Native SVG |
| **Integração** | API REST com Axios |
| **Sessão e perfil local** | Expo SecureStore (Android/iOS) e armazenamento do navegador (Web) |
| **Anexos locais** | Expo Document Picker, Expo File System e Expo Sharing |
| **Backend** | **Java com Spring Boot** |
| **Segurança da API** | Spring Security e autenticação JWT |
| **Banco de dados** | **Oracle Database**, acessado pela API Java |
| **Assistente de IA** | Serviço de IA baseado em Ollama, quando configurado e acessível |
| **Versionamento** | Git e GitHub |

### Arquitetura resumida

```text
              VENTRYA MOBILE
         React Native + Expo + TS
                     |
                  HTTP/REST
                     |
             API JAVA — SPRING BOOT
         Autenticação JWT e regras
                     |
               Oracle Database

Recursos armazenados localmente no aplicativo:
- Avatar e informações do perfil
- Pontuações da Arena
- Currículo original anexado no dispositivo

Recurso opcional do ambiente de demonstração:
- Serviço de IA / Ollama, quando configurado
```

O aplicativo **não se conecta diretamente ao Oracle**: os recursos que exigem persistência no banco são atendidos pela **API Java**.

## 4. Estrutura principal do Mobile

```text
ventrya-mobile/
├── src/
│   ├── app/
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── cadastro.tsx
│   │   ├── painel.tsx
│   │   ├── perfil.tsx
│   │   ├── desafios.tsx
│   │   ├── desafios/
│   │   │   └── [id].tsx
│   │   ├── avaliacoes.tsx
│   │   └── arena.tsx
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   └── CurriculoOriginal.tsx
│   └── services/
│       ├── api.ts
│       └── arenaStorage.ts
├── app.json
├── package.json
├── package-lock.json
└── README.md
```

*Esta é uma visão resumida. O projeto contém outros arquivos de configuração e componentes.*

## 5. Como executar localmente

### Pré-requisitos

- Node.js, npm e Git;
- Android Studio com emulador Android **ou** dispositivo compatível com Expo Go;
- API Java do Ventrya em execução para funcionalidades dependentes do servidor;
- Acesso autorizado ao Oracle Database, configurado **no backend Java**.

### Instalação do Mobile

```powershell
git clone https://github.com/marina-2907/Ventrya-Mobile.git
cd Ventrya-Mobile
npm ci
```

### Iniciar o aplicativo

```powershell
npx expo start --go --localhost --clear
```

Com o emulador Android aberto, pressione **`a`** no terminal do Expo.

Se o aplicativo utilizar `localhost` para acessar a API na porta `8080` e o Metro na porta `8081`, o encaminhamento das portas no emulador poderá ser necessário:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb reverse tcp:8080 tcp:8080
& $adb reverse tcp:8081 tcp:8081
```

Confirme a URL base em `src/services/api.ts`. Para dispositivos físicos, utilize um endereço de API alcançável pela rede do aparelho.

### Iniciar a API Java

Em outro terminal, dentro da pasta do projeto **Ventrya API Java**, configure as variáveis de ambiente exigidas pelo backend e execute:

```powershell
.\gradlew.bat bootRun
```

O backend utiliza credenciais de acesso ao Oracle e segredo de assinatura JWT, que devem ser fornecidos **fora do repositório**. **Não publique senhas, tokens ou segredos no GitHub.**

## 6. Fluxo sugerido para demonstração

1. Criar uma conta e realizar o login;
2. Apresentar o painel de acompanhamento;
3. Abrir **Meu Perfil** e criar o avatar;
4. Editar e salvar o currículo resumido;
5. Anexar e abrir um currículo em PDF ou Word;
6. Consultar desafios, realizar uma inscrição e mostrar uma entrega;
7. Acompanhar o estado das avaliações;
8. Jogar uma atividade da Arena e verificar a pontuação;
9. Demonstrar o Ventrya IA, caso o serviço esteja disponível;
10. Mostrar a API Java e sua integração com o Oracle.

## 7. Escopo e limitações do MVP

- **Perfil e avatar:** armazenados localmente, sem sincronização automática entre a Web e o Android.
- **Currículo original:** o candidato pode selecionar, guardar, abrir, compartilhar, substituir e remover seu arquivo no dispositivo. **O documento ainda não é enviado à API nem disponibilizado para recrutadores em outras contas.** Essa evolução exigiria upload, armazenamento persistente e permissões adequadas no backend.
- **Arena:** os melhores resultados ficam locais; o acesso a essas pontuações por contratantes é uma possibilidade de evolução futura.
- **Ventrya IA:** depende de um serviço de IA configurado, em execução e acessível no ambiente de demonstração.

## 8. Repositório

- **Ventrya Mobile:** https://github.com/marina-2907/Ventrya-Mobile

*O backend Java é mantido em projeto separado. Seu link pode ser adicionado aqui após a publicação.*

## 9. Vídeo de apresentação

O vídeo demonstra a proposta do Ventrya, os principais recursos do aplicativo e as tecnologias utilizadas no projeto.

**[▶ Assistir à apresentação do Ventrya — Global Solution FIAP 2026](https://youtu.be/yam3ESry7f8)**

## 10. Equipe de desenvolvimento

| Integrante | RM |
|---|---|
| **Felipe Maglio Filho** | 563512 |
| **João Pedro Bitencourt Goldoni** | 564339 |
| **Marina Tamagnini Magalhães** | 561786 |
| **Mateus Granja dos Santos** | 564930 |
| **Vitória Valentina Maglio** | 563509 |

**Instituição:** FIAP

**Curso:** Análise e Desenvolvimento de Sistemas

**Projeto:** Ventrya

**Entrega:** Global Solution 2026/2

---

**VENTRYA — Transformando habilidades em oportunidades.**

*Projeto acadêmico desenvolvido para a Global Solution 2026/2 — FIAP.*
