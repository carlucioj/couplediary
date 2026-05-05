# Documento de Requisitos

## Introdução

Esta feature aprimora o calendário do **Nosso Diário** — aplicativo de diário de casal — com uma interface visual rica, ícones coloridos por tipo de evento, indicadores visuais nos dias com compromissos e integração com agendas externas (Google Agenda e agenda nativa via `.ics`/`webcal://`). Além disso, define os pré-requisitos técnicos e o roadmap de migração para um app mobile nativo (React Native / Expo) ou PWA, preparando a base de código atual (TanStack Start + React 19 + Tailwind CSS v4 + Supabase + TypeScript) para essa evolução.

---

## Glossário

- **Calendar**: O componente de calendário visual localizado na rota `/app/calendar`.
- **Event**: Um registro na tabela `events` do Supabase com campos `id`, `title`, `description`, `starts_at`, `ends_at`, `event_type`, `couple_id`.
- **EventType**: Enumeração dos tipos de evento suportados: `anniversary` (aniversário), `trip` (viagem), `date` (encontro), `memory` (memória), `reminder` (lembrete).
- **EventBadge**: Indicador visual colorido exibido em uma célula do calendário para representar um ou mais eventos naquele dia.
- **ICS_Exporter**: Módulo responsável por gerar arquivos `.ics` compatíveis com o padrão iCalendar (RFC 5545).
- **ICS_Feed**: URL pública ou autenticada que serve um arquivo `.ics` para subscrição contínua via protocolo `webcal://`.
- **Google_Calendar_Link**: URL de redirecionamento para o Google Calendar pré-preenchida com os dados do evento.
- **DayCell**: Célula individual do grid do calendário representando um dia do mês.
- **EventPanel**: Painel lateral ou seção abaixo do calendário que exibe os eventos do dia selecionado.
- **Mobile_App**: Aplicativo nativo para iOS e Android a ser desenvolvido em fase futura usando React Native / Expo.
- **PWA**: Progressive Web App — versão instalável do app web atual com suporte offline e notificações push.
- **Couple**: Par de usuários vinculados na tabela `couples` do Supabase.
- **Demo_Mode**: Modo de demonstração ativado via `localStorage` que usa dados mockados sem conexão com Supabase.

---

## Requisitos

### Requisito 1: Indicadores Visuais por Tipo de Evento no Calendário

**User Story:** Como um dos parceiros do casal, quero ver ícones coloridos nos dias do calendário que possuem eventos, para identificar rapidamente o tipo de compromisso sem precisar clicar em cada dia.

#### Critérios de Aceitação

1. WHEN o Calendar renderiza um mês, THE Calendar SHALL exibir em cada DayCell que contém pelo menos um Event um EventBadge colorido correspondente ao EventType do primeiro evento do dia.
2. WHEN um DayCell contém eventos de mais de um EventType distinto, THE Calendar SHALL exibir até 3 EventBadges empilhados horizontalmente naquele DayCell.
3. WHEN um DayCell contém mais de 3 eventos, THE Calendar SHALL exibir 3 EventBadges e um indicador numérico com a contagem total de eventos do dia.
4. THE Calendar SHALL usar as seguintes cores e ícones por EventType:
   - `anniversary`: cor rosa (`#F472B6`), ícone de coração (💖)
   - `trip`: cor azul (`#60A5FA`), ícone de avião (✈️)
   - `date`: cor roxo (`#A78BFA`), ícone de taça (🍷)
   - `memory`: cor âmbar (`#FBBF24`), ícone de câmera (📸)
   - `reminder`: cor verde (`#34D399`), ícone de sino (🔔)
5. WHEN o EventType de um Event não corresponde a nenhum valor da enumeração EventType, THE Calendar SHALL exibir um EventBadge cinza com ícone de calendário genérico.
6. THE Calendar SHALL manter os EventBadges visíveis em telas com largura mínima de 320px sem truncamento ou sobreposição com o número do dia.

---

### Requisito 2: Seleção de Dia e Painel de Eventos

**User Story:** Como um dos parceiros do casal, quero clicar em um dia do calendário e ver todos os eventos daquele dia em um painel detalhado, para planejar e revisar compromissos com facilidade.

#### Critérios de Aceitação

1. WHEN o usuário clica em um DayCell, THE Calendar SHALL atualizar o estado `selected` para a data correspondente e exibir os eventos daquele dia no EventPanel.
2. WHEN o EventPanel é exibido para um dia sem eventos, THE Calendar SHALL mostrar uma mensagem "Nada agendado nesse dia." e um botão "Criar evento" que abre o formulário de criação com a data pré-preenchida.
3. WHEN o EventPanel exibe um Event, THE Calendar SHALL mostrar: título, horário de início formatado em `HH:mm`, tipo com ícone colorido, descrição (se presente) e ações de exportação e exclusão.
4. WHEN o usuário faz duplo clique em um DayCell, THE Calendar SHALL abrir o formulário de criação de evento com o campo `starts_at` pré-preenchido com a data do DayCell e horário padrão `20:00`.
5. WHILE o Calendar está carregando eventos do Supabase, THE EventPanel SHALL exibir um skeleton loader no lugar da lista de eventos.

---

### Requisito 3: Exportação para Google Agenda

**User Story:** Como um dos parceiros do casal, quero exportar um evento para o Google Agenda com um clique, para sincronizar meus compromissos do casal com minha agenda pessoal.

#### Critérios de Aceitação

1. WHEN o usuário clica no botão "Abrir no Google Calendar" de um Event no EventPanel, THE Google_Calendar_Link SHALL abrir em uma nova aba do navegador a URL `https://calendar.google.com/calendar/render` com os parâmetros `action=TEMPLATE`, `text`, `dates` e `details` preenchidos com os dados do Event.
2. WHEN o Event não possui `ends_at`, THE Google_Calendar_Link SHALL calcular o horário de término como `starts_at + 1 hora` para preencher o parâmetro `dates`.
3. WHEN o Event possui `ends_at`, THE Google_Calendar_Link SHALL usar o valor de `ends_at` para preencher o fim do parâmetro `dates`.
4. THE Google_Calendar_Link SHALL codificar todos os parâmetros da URL usando `encodeURIComponent` para garantir compatibilidade com caracteres especiais e acentos do português.

---

### Requisito 4: Exportação para Agenda Nativa via ICS

**User Story:** Como um dos parceiros do casal, quero exportar um evento para minha agenda nativa (Apple Calendar, Outlook, etc.) via arquivo `.ics`, para manter todos os meus compromissos sincronizados independentemente do sistema operacional.

#### Critérios de Aceitação

1. WHEN o usuário clica no botão "Exportar .ics" de um Event no EventPanel, THE ICS_Exporter SHALL gerar e fazer download de um arquivo `.ics` válido conforme RFC 5545 contendo os dados do Event.
2. THE ICS_Exporter SHALL incluir no arquivo `.ics` os campos: `BEGIN:VCALENDAR`, `VERSION:2.0`, `PRODID:-//Nosso Diário//PT`, `BEGIN:VEVENT`, `UID`, `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`, `END:VEVENT`, `END:VCALENDAR`.
3. WHEN o Event não possui `ends_at`, THE ICS_Exporter SHALL definir `DTEND` como `DTSTART + 1 hora`.
4. THE ICS_Exporter SHALL formatar `DTSTART` e `DTEND` no formato UTC `YYYYMMDDTHHmmssZ` conforme RFC 5545.
5. IF o campo `description` do Event contém caracteres especiais (vírgula, ponto-e-vírgula, barra invertida, quebra de linha), THEN THE ICS_Exporter SHALL escapar esses caracteres conforme a especificação RFC 5545 antes de incluí-los no arquivo.
6. THE ICS_Exporter SHALL definir o nome do arquivo de download como `nosso-diario-{event-id}.ics`.

---

### Requisito 5: Feed ICS para Subscrição Contínua

**User Story:** Como um dos parceiros do casal, quero assinar um feed `webcal://` com todos os eventos do casal, para que minha agenda nativa sincronize automaticamente novos eventos sem precisar exportar manualmente.

#### Critérios de Aceitação

1. THE Calendar SHALL exibir um botão "Assinar Calendário" que, ao ser clicado, abre um link `webcal://` apontando para o endpoint `/api/calendar/ics/{couple_id}`.
2. WHEN o endpoint `/api/calendar/ics/{couple_id}` recebe uma requisição GET autenticada, THE ICS_Feed SHALL retornar um arquivo `.ics` válido contendo todos os Events do Couple com `Content-Type: text/calendar; charset=utf-8`.
3. WHEN o endpoint `/api/calendar/ics/{couple_id}` recebe uma requisição de um usuário não autenticado ou não membro do Couple, THE ICS_Feed SHALL retornar HTTP 401.
4. THE ICS_Feed SHALL incluir no arquivo `.ics` retornado o campo `X-WR-CALNAME` com o valor `Nosso Diário — {public_handle do casal}`.
5. WHILE o app está em Demo_Mode, THE Calendar SHALL exibir o botão "Assinar Calendário" desabilitado com tooltip "Disponível apenas na versão completa".

---

### Requisito 6: Navegação Mensal e Acessibilidade do Calendário

**User Story:** Como um dos parceiros do casal, quero navegar entre os meses do calendário de forma fluida e acessível, para visualizar eventos passados e futuros com facilidade.

#### Critérios de Aceitação

1. WHEN o usuário clica no botão de navegação "mês anterior", THE Calendar SHALL decrementar o mês exibido em 1 e recarregar os eventos do novo período.
2. WHEN o usuário clica no botão de navegação "próximo mês", THE Calendar SHALL incrementar o mês exibido em 1 e recarregar os eventos do novo período.
3. THE Calendar SHALL exibir o nome do mês e o ano no formato capitalizado em português (ex.: "Fevereiro 2026") no cabeçalho da grade.
4. THE Calendar SHALL marcar o dia atual com destaque visual distinto (fundo `bg-blush`, texto `text-primary`, fonte `font-semibold`) diferente do dia selecionado.
5. THE Calendar SHALL garantir que todos os botões de navegação e células de dia possuam atributos `aria-label` descritivos para leitores de tela.
6. THE Calendar SHALL garantir contraste mínimo de 4.5:1 entre o texto dos EventBadges e seus fundos coloridos, conforme WCAG 2.1 AA.

---

### Requisito 7: Compatibilidade com Demo Mode

**User Story:** Como um visitante que usa o modo demo, quero que o calendário visual funcione completamente com dados mockados, para avaliar a experiência antes de criar uma conta.

#### Critérios de Aceitação

1. WHILE o app está em Demo_Mode, THE Calendar SHALL carregar os eventos de `DEMO_EVENTS` de `src/lib/demo-data.ts` sem realizar chamadas ao Supabase.
2. WHILE o app está em Demo_Mode, THE Calendar SHALL permitir criar, visualizar e excluir eventos apenas em memória (estado local), sem persistência.
3. WHILE o app está em Demo_Mode, THE ICS_Exporter SHALL funcionar normalmente para eventos criados na sessão demo.
4. WHILE o app está em Demo_Mode, THE Calendar SHALL exibir os EventBadges coloridos nos dias que possuem eventos de `DEMO_EVENTS`.

---

### Requisito 8: Pré-requisitos Técnicos para App Mobile

**User Story:** Como desenvolvedor do Nosso Diário, quero uma lista clara de pré-requisitos técnicos que precisam ser implementados na versão web antes de iniciar o desenvolvimento mobile, para garantir que a migração seja eficiente e sem retrabalho.

#### Critérios de Aceitação

1. THE sistema SHALL separar toda a lógica de negócio de eventos (busca, criação, exclusão, exportação) em hooks React reutilizáveis (`useEvents`, `useICSExport`) independentes de componentes de UI específicos do web.
2. THE sistema SHALL definir e exportar os tipos TypeScript de domínio (`Event`, `EventType`, `Couple`) em um módulo compartilhado `src/lib/types.ts` sem dependências de bibliotecas exclusivas do ambiente web (ex.: `window`, `document`).
3. THE sistema SHALL implementar a camada de acesso a dados do Supabase em funções puras isoladas em `src/lib/api/events.ts`, sem acoplamento direto a componentes React.
4. THE sistema SHALL garantir que nenhuma lógica de negócio crítica dependa de APIs exclusivas do browser (`localStorage`, `window.location`, `document.createElement`) sem uma camada de abstração.
5. THE sistema SHALL documentar em `docs/mobile-prerequisites.md` a lista de dependências que precisam de substitutos mobile-compatíveis (ex.: `react-day-picker` → substituir por componente nativo, `sonner` → substituir por notificação nativa).

---

### Requisito 9: Roadmap de Migração para App Mobile

**User Story:** Como desenvolvedor do Nosso Diário, quero um roadmap estruturado de migração da versão web para mobile, para planejar as fases de desenvolvimento e tomar decisões arquiteturais informadas.

#### Critérios de Aceitação

1. THE sistema SHALL documentar em `docs/mobile-roadmap.md` as fases de migração com objetivos, entregáveis e critérios de conclusão para cada fase.
2. THE sistema SHALL incluir no roadmap uma análise comparativa entre as abordagens PWA e React Native / Expo, com critérios de decisão baseados nas necessidades do Nosso Diário (notificações push, acesso à câmera, performance offline).
3. THE sistema SHALL incluir no roadmap a estratégia de compartilhamento de código entre web e mobile, identificando os módulos que podem ser reutilizados sem modificação (lógica de negócio, tipos, chamadas Supabase) e os que precisam de versões específicas por plataforma (componentes UI, navegação).
4. THE sistema SHALL incluir no roadmap os requisitos de infraestrutura adicionais necessários para suporte mobile: push notifications via Supabase Edge Functions ou serviço externo (ex.: Expo Push Notifications), deep linking, e autenticação OAuth mobile.
5. THE sistema SHALL incluir no roadmap estimativas de esforço por fase em semanas de desenvolvimento para uma equipe de 1-2 desenvolvedores.

---

### Requisito 10: Abordagem PWA como Etapa Intermediária

**User Story:** Como desenvolvedor do Nosso Diário, quero implementar o app como PWA antes de desenvolver o app nativo, para entregar uma experiência mobile instalável mais rapidamente com o menor custo de migração.

#### Critérios de Aceitação

1. THE sistema SHALL adicionar um `manifest.json` com `name`, `short_name`, `icons`, `start_url`, `display: standalone`, `theme_color` e `background_color` compatíveis com os requisitos de instalação do Chrome e Safari.
2. THE sistema SHALL registrar um Service Worker que implemente cache offline para as rotas principais do app (`/app/home`, `/app/calendar`, `/app/diary`).
3. WHEN o usuário acessa o app em um dispositivo mobile sem conexão à internet, THE Service_Worker SHALL servir a versão em cache das rotas principais com um indicador visual de modo offline.
4. WHERE o dispositivo suporta notificações push web, THE sistema SHALL implementar a solicitação de permissão de notificação e o envio de push notifications via Supabase Edge Functions para eventos com data futura.
5. IF o navegador não suporta Service Workers, THEN THE sistema SHALL continuar funcionando normalmente sem funcionalidades offline, sem exibir erros ao usuário.
