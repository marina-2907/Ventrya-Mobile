# Ventrya — Mobile

### Global Solution 2026/2 | FIAP — Análise e Desenvolvimento de Sistemas

**Seu potencial merece uma oportunidade.**

O **Ventrya** é um aplicativo desenvolvido para apoiar pessoas em início de carreira, especialmente aquelas com pouca ou nenhuma experiência profissional. Em vez de depender apenas do currículo, a proposta é permitir que o candidato **aprenda, pratique e demonstre suas competências** por meio de desafios práticos, atividades de raciocínio e acompanhamento da jornada de candidatura.

> **Contexto acadêmico:** Projeto desenvolvido para a Global Solution 2026/2 da FIAP. O aplicativo é um MVP acadêmico; algumas funcionalidades dependem da execução dos serviços de backend e outras permanecem locais no dispositivo.

---

## 1. Problema e proposta

A falta de experiência pode dificultar o acesso às primeiras oportunidades de trabalho. O Ventrya busca reduzir essa barreira oferecendo um ambiente em que o candidato pode:

- Criar uma identidade profissional e organizar suas informações;
- Consultar oportunidades e participar de desafios práticos;
- Enviar projetos para demonstrar habilidades;
- Acompanhar inscrições, entregas e avaliações;
- Desenvolver competências na **Arena Ventrya**;
- Utilizar recursos de inteligência artificial como apoio à preparação profissional.

A solução se relaciona aos Objetivos de Desenvolvimento Sustentável **ODS 4 — Educação de Qualidade**, **ODS 8 — Trabalho Decente e Crescimento Econômico** e **ODS 10 — Redução das Desigualdades**.

## 2. Funcionalidades do aplicativo

| Módulo | Funcionalidades |
|---|---|
| **Cadastro e login** | Criação de conta, validação dos campos, autenticação com a API Java e sessão do usuário |
| **Painel** | Visão geral da jornada, indicadores de candidaturas e acesso aos desafios |
| **Meu Perfil** | Dados profissionais, currículo resumido, formação, experiências, habilidades e contatos |
| **Avatar Ventrya** | Criador de personagem com personalização de aparência e acessórios |
| **Currículo original** | Seleção e armazenamento local de PDF, DOC ou DOCX; abertura, compartilhamento, substituição e remoção |
| **Desafios** | Consulta de desafios, inscrição e acompanhamento das etapas |
| **Entregas** | Envio de projeto/solução e tratamento de situações como entrega já realizada |
| **Avaliações** | Consulta e acompanhamento das avaliações e entregas disponíveis |
| **Arena Ventrya** | Sete atividades com registro dos melhores resultados por usuário no dispositivo |
| **Ventrya IA** | Interface de assistência para dúvidas relacionadas à jornada profissional, dependente do serviço de IA configurado |

### Arena Ventrya

A Arena reúne sete experiências de prática:

1. Sequência Lógica
2. Sudoku Mestre
3. Labirinto Estratégico
4. Memória Tech
5. Teste de Inglês
6. Teste de Português
7. Teste de Matemática

Cada atividade apresenta resultado de até **100 pontos**, permitindo acompanhar até **700 pontos** na soma dos melhores resultados. Nesta versão, a pontuação é mantida localmente por usuário; **não representa, por si só, uma avaliação oficial ou classificação de recrutadores**.

## 3. Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Aplicativo mobile | React Native, Expo e TypeScript |
| Navegação | Expo Router |
| Componentes visuais | Expo Linear Gradient, Ionicons e React Native SVG |
| Comunicação com API | Requisições HTTP/REST com Axios |
| Armazenamento de sessão e perfil | Expo SecureStore (mobile) e armazenamento do navegador (web) |
| Seleção e manipulação local de currículo | Expo Document Picker, Expo File System e Expo Sharing |
| Backend principal | Java e Spring Boot |
| Autenticação no backend | Spring Security e JWT |
| Persistência do backend | Oracle Database |
| Assistente de IA | Integração com serviço local baseado em Ollama, conforme configuração do ambiente |
| API complementar | ASP.NET Core .NET, em repositório independente |
| Versionamento | Git e GitHub |

### Arquitetura resumida

```text
                      Ventrya Mobile
                React Native + Expo + TS
                         |
                    HTTP / REST
                         |
                   API Java Spring Boot
                    JWT + regras de negócio
                         |
                    Oracle Database

Recursos locais do aplicativo:
- Avatar e informações do perfil
- Pontuações da Arena
- Currículo original anexado no dispositivo

Serviços complementares, executados separadamente:
- Assistência por IA / Ollama (quando configurado)
- API de avaliações .NET (projeto acadêmico independente)
```

O aplicativo **não se conecta diretamente ao Oracle**: a persistência dos recursos de backend é intermediada pela API Java.

## 4. Estrutura principal

```text
ventrya-mobile/
├── src/
│   ├── app/
│   │   ├── login.tsx
│   │   ├── cadastro.tsx
│   │   ├── painel.tsx
│   │   ├── perfil.tsx
│   │   ├── desafios.tsx
│   │   ├── desafios/[id].tsx
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

*Estrutura resumida: o repositório inclui outros arquivos de configuração, telas e componentes.*

## 5. Como executar localmente

### Pré-requisitos

- Node.js e npm;
- Git;
- Android Studio e emulador Android **ou** dispositivo compatível com Expo Go;
- API Java do Ventrya em execução para funcionalidades que dependem do servidor;
- Ambiente Oracle da FIAP configurado no backend, quando necessário.

### Instalação

```powershell
git clone https://github.com/marina-2907/Ventrya-Mobile.git
cd ventrya-Mobile
npm ci
```

> Antes de executar, confira em `src/services/api.ts` a configuração de endereço da API adequada ao ambiente. Não publique senhas, tokens ou segredos no código-fonte.

### Executar o aplicativo

```powershell
npx expo start --go --localhost --clear
```

Com o emulador aberto, pressione **`a`** no terminal do Expo para abrir o aplicativo Android.

Se estiver usando o emulador Android com o backend Java na porta `8080` do mesmo computador, pode ser necessário encaminhar as portas:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb reverse tcp:8080 tcp:8080
& $adb reverse tcp:8081 tcp:8081
```

O encaminhamento depende da forma como a URL base está configurada no serviço de API. Para execução em um dispositivo físico ou em outra rede, configure um endereço alcançável pelo dispositivo.

### Backend Java

O backend Spring Boot é executado em projeto separado. Em seu diretório, configure as variáveis de ambiente e inicie:

```powershell
.\gradlew.bat bootRun
```

A configuração do backend requer credenciais Oracle e segredo JWT válidos, fornecidos **fora do repositório**, por variáveis de ambiente ou mecanismo seguro de configuração. Não inclua credenciais reais no README ou no GitHub.

## 6. Fluxo de demonstração

1. Criar uma conta e realizar o login;
2. Explorar o painel de acompanhamento;
3. Abrir **Meu Perfil** e criar o avatar;
4. Editar e salvar o currículo resumido;
5. Anexar um currículo PDF/Word no dispositivo;
6. Consultar desafios, realizar uma inscrição e apresentar uma entrega;
7. Acessar a área de avaliações;
8. Jogar uma atividade da Arena e consultar o recorde;
9. Mostrar o assistente de IA, caso o serviço esteja ativo;
10. Demonstrar a API Java e suas rotas no ambiente de desenvolvimento.

## 7. Escopo e limitações do MVP

- **Perfil e avatar:** salvos localmente, com armazenamento distinto entre web e Android; não há sincronização automática entre dispositivos nesta versão.
- **Currículo original:** o candidato pode selecionar, guardar e abrir seu PDF/DOC/DOCX localmente. **O arquivo ainda não é enviado ao servidor nem disponibilizado para recrutadores em outras contas.** Isso exigiria armazenamento persistente, endpoint de upload e autorização adequada no backend.
- **Arena:** os melhores resultados são armazenados localmente; a utilização desses dados por contratantes é uma possibilidade de evolução futura, não uma integração já concluída.
- **Ventrya IA:** depende do serviço configurado e acessível no ambiente de execução.

## 8. Repositórios relacionados

- **Ventrya Mobile:** https://github.com/marina-2907/Ventrya-Mobile


## 9. Vídeo de apresentação

### Demonstração do Ventrya — Global Solution 2026/2

O vídeo apresenta a proposta do Ventrya, sua arquitetura
e as principais funcionalidades do aplicativo.

São demonstrados o cadastro e login, painel inicial,
personalização do avatar, currículo profissional,
desafios práticos, candidaturas, avaliações,
Arena Ventrya e recursos de inteligência artificial.

Também são apresentadas as tecnologias utilizadas
no desenvolvimento do projeto.

**Assista à apresentação completa:**

[▶️ Ventrya — Global Solution FIAP 2026](https://youtu.be/yam3ESry7f8?si=l8Kxsn_ltfPxc6Ey)


## 10. Equipe de desenvolvimento

**Mesmos integrantes da Sprint 4 do Challenge ClyvoCare OS — FIAP 2026:**

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
