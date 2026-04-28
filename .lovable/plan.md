
# Nosso Diário — App Romântico do Casal

Um site web responsivo (mobile-first) para você e sua namorada registrarem juntos a história de vocês: restaurantes visitados, desejos, datas marcantes, tempo de namoro, diário do dia e uma rede social leve entre casais. Cada atualização gera um link pronto de WhatsApp para avisar a pessoa amada com um toque.

## Visão geral da experiência

- **Mobile-first**, funciona em qualquer celular (Android/iOS) pelo navegador, e também no desktop.
- Tela inicial em estilo "feed do casal": contador de namoro no topo, próximos marcos, últimas memórias.
- Navegação inferior estilo app (Home, Restaurantes, Desejos, Calendário, Casais, Perfil).
- Paleta romântica suave (rosê/terracota + off-white), micro-animações nos cards.

## Estrutura de contas e privacidade

- Cada pessoa cria conta própria (email + senha; Google opcional).
- Um dos dois cria o **"Casal"** e gera um **código de convite** de 6 dígitos; a outra entra com o código e os dois ficam vinculados.
- Todos os dados pertencem ao *casal* — ambos veem e editam tudo.
- **Isolamento total entre casais**: um usuário só acessa dados do próprio casal. Nenhum dado sensível vaza entre casais, nem mesmo no recurso social (ver abaixo).
- Autoria preservada: cada registro mostra "adicionado por Você" ou "por [nome]".

## Seções do app

### 1. Home (Dashboard)
- Contador animado: anos, meses, dias, horas, minutos.
- Próximo marco (500 dias, aniversários, etc.).
- Últimas 3 atividades.
- Atalhos: "+ Restaurante", "+ Desejo", "+ Memória do dia".

### 2. Restaurantes
- **Visitados**: foto, nome, data, nota, comentário, prato favorito, localização.
- **Quero visitar**: lista de desejo gastronômico; botão "Marcamos!" move para Visitados.
- Filtros por nota, cidade, data.

### 3. Lista de Desejos (produtos)
- Cola a URL (Nike, Adidas, Farm, Amazon…) e o sistema **extrai** título, imagem, preço e marca via Firecrawl.
- Fallback manual editável.
- "Para ela / Para ele / Para nós".
- Status: *Desejado*, *Comprado*, *Presenteado*.

### 4. Calendário e **Diário do Dia** (NOVO)
- Visão mensal interativa, dias com atividade ficam marcados com um coraçãozinho.
- Tipos de entrada:
  - **Eventos** (aniversário de namoro recorrente, aniversários, encontros agendados, viagens).
  - **Memórias do dia** — toque em qualquer dia do calendário e registre "o que fizemos hoje": título, texto livre, humor (emoji), fotos opcionais e links para registros já existentes (restaurante visitado, item comprado). Isso cria automaticamente uma entrada no calendário.
- Botão "+ Hoje" sempre visível na Home para registrar rapidamente o dia.
- Linha do tempo: ao rolar, vê-se cronologicamente tudo que aconteceu (eventos + memórias + restaurantes + compras).
- **Integração com Google Calendar** (Fase 2): eventos do casal sincronizam bidirecionalmente.

### 5. Casais — Rede social leve (NOVO, esforço mínimo)
Uma rede *opt-in* para casais se conectarem com outros casais amigos. **Por padrão desativada** — nada é exibido publicamente a menos que o casal ative.

- **Perfil público do casal**: apelido do casal, foto, data de início, cidade. Apenas isso. Nada de restaurantes, desejos, memórias ou diário.
- **Buscar por apelido** e enviar "pedido de amizade de casal".
- **Amizade**: quando ambos os casais aceitam, cada lado vê um *mural compartilhado mínimo* — só o contador de tempo de namoro do outro casal e posts que o outro casal escolher marcar como "compartilhar com amigos" (ex: "Fomos ao restaurante X ❤️").
- **Feed de amigos**: lista simples dos posts compartilhados pelos casais conectados.
- **Nada mais vaza**: restaurantes privados, desejos, fotos do diário e detalhes nunca aparecem a menos que explicitamente marcados como compartilháveis.
- Botão "Remover amizade" a qualquer momento; casais bloqueados nunca aparecem em buscas.

### 6. Perfil do casal
- Nomes, data de início do namoro, foto.
- Gestão de convite / desvincular.
- Preferências de WhatsApp e de rede social (ativar/desativar, quem pode encontrar).

## Notificações via WhatsApp (link wa.me)

Sempre que houver atualização (novo restaurante, desejo realizado, memória do dia, novo marco), aparece o botão **"Avisar meu amor 💌"** que abre o WhatsApp com mensagem pronta:

> *"Amor, registrei nossa noite de ontem no nosso diário ❤️ 'Jantar no Di Napoli' — vê lá: [link]"*

Zero custo, um toque e envia.

## Segurança

- Autenticação gerenciada + proteção contra senhas vazadas.
- **Row-Level Security** em toda tabela: acesso só se o usuário for membro do casal dono da linha.
- Tabela separada para **perfil público do casal** e **posts compartilháveis** — única parte com RLS mais permissiva, e mesmo assim só visível para casais amigos aceitos mutuamente.
- Convite por código de uso único e expirável.
- Validação rigorosa (Zod) em todas entradas, inclusive URLs.
- Nada indexável publicamente.

## Entrega em fases

**Fase 1 — Fundação:**
1. Auth + Casal por código de convite.
2. Home + contador + feed de atividades.
3. Restaurantes (visitados + quero visitar).
4. Lista de Desejos com extração via Firecrawl.
5. Calendário + **Diário do Dia** (memórias ancoradas a datas).
6. **Rede de Casais** opt-in (perfil público mínimo, amizade mútua, mural compartilhável).
7. Botão WhatsApp nas ações.
8. RLS rigorosa + isolamento entre casais.

**Fase 2 (depois):**
- Google Calendar sync bidirecional.
- Upload de fotos no diário.
- Livro de memórias em PDF.

Recomendo entregar a Fase 1, testar com sua namorada, e só depois plugar Google Calendar.

## Detalhes técnicos

- **Stack**: TanStack Start (React 19 + Vite) + Tailwind v4 + shadcn/ui.
- **Backend**: Lovable Cloud (Supabase) — Postgres, Auth, Storage, Server Functions.
- **Modelo de dados principal**:
  - `profiles(user_id, name, avatar, phone)`
  - `couples(id, anniversary_date, invite_code, invite_expires_at, public_handle, public_avatar, public_city, is_discoverable)`
  - `couple_members(couple_id, user_id)` — fonte de verdade para RLS.
  - `restaurants`, `wishlist_items`, `events` — todos com `couple_id`.
  - `day_memories(id, couple_id, date, title, note, mood, is_shared, created_by)` — diário do dia.
  - `activities(id, couple_id, actor_id, type, payload, created_at)` — feed unificado.
  - `couple_friendships(id, couple_a, couple_b, status[pending|accepted|blocked], requested_by)` — amizade bidirecional.
  - `shared_posts(id, couple_id, kind[memory|restaurant|milestone], ref_id, caption, created_at)` — apenas isto aparece no feed social.
- **RLS**:
  - Função `is_couple_member(_couple_id, _user_id)` (SECURITY DEFINER).
  - Função `are_couples_friends(_a, _b)` consultando `couple_friendships` com status=accepted.
  - Tabelas privadas: SELECT/INSERT/UPDATE/DELETE só se `is_couple_member`.
  - `couples` perfil público: SELECT aberto aos campos `public_*` quando `is_discoverable=true`; campos privados restritos a membros.
  - `shared_posts`: SELECT se membro do casal dono OU se `are_couples_friends(meu_casal, couple_id)`.
- **Extração de produtos**: server function → **Firecrawl** connector (`formats: ['markdown']` + OG parsing); API key só no servidor.
- **WhatsApp**: `https://wa.me/<tel>?text=<encodeURIComponent>` client-side.
- **Google Calendar (Fase 2)**: OAuth per-user; tokens criptografados; sync via `google_event_id`.
- **Rotas** (arquivos `src/routes/`, cada uma com `head()` próprio):
  - `/`, `/login`, `/signup`, `/join`
  - `/_authenticated/home`, `/restaurants`, `/restaurants/$id`, `/wishlist`, `/wishlist/$id`, `/calendar`, `/calendar/$date`, `/couples` (busca + amigos), `/couples/$handle`, `/profile`
- **PWA-ready**: manifest + ícones para "adicionar à tela inicial".
- **Validação**: Zod em formulários e server functions; limites de tamanho e regex em URLs/telefones/handles.

Pronto para implementar a Fase 1 assim que você aprovar.
