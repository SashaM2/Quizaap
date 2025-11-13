# 🔍 Guia de Verificação das Páginas

## 📋 Como Verificar as Páginas Recriadas

### 1. **Iniciar o Servidor**

```bash
pnpm dev
```

O servidor estará disponível em:
- **Local**: `http://localhost:3000`
- **Network**: `http://172.20.10.4:3000`

Se a porta 3000 estiver ocupada, o Next.js usará a porta 3001 automaticamente.

---

### 2. **Página de Criação de Quiz** (`/quizzes/new`)

**URL**: `http://localhost:3000/quizzes/new`

**O que verificar:**
- ✅ Fundo escuro com gradiente (azul escuro)
- ✅ Header azul com título "Quiz Tracker"
- ✅ Formulário com campos "Quiz Name" e "Quiz URL"
- ✅ Botão "Generate Tracking Code"
- ✅ Após criar, aparece mensagem de sucesso verde
- ✅ Script de tracking aparece em caixa de código escura
- ✅ Botão "Copy Script" funciona
- ✅ Link "View Dashboard" aparece após criar
- ✅ Seção "Add Lead Capture Form" com código de exemplo
- ✅ Seção "Quick Links" com cards dos quizzes existentes

**Como testar:**
1. Faça login como usuário (não admin)
2. Acesse `/quizzes/new`
3. Preencha o formulário:
   - Quiz Name: "Test Quiz"
   - Quiz URL: "https://example.com/quiz"
4. Clique em "Generate Tracking Code"
5. Verifique se o script aparece e pode ser copiado

---

### 3. **Página de Leads** (`/quizzes/[id]/leads`)

**URL**: `http://localhost:3000/quizzes/[QUIZ_ID]/leads`

**O que verificar:**
- ✅ Navbar azul no topo com links (Home, Analytics, Leads)
- ✅ Título "Lead Management"
- ✅ 4 cards de estatísticas no topo:
  - Total Leads
  - This Week
  - This Month
  - Avg Response Rate
- ✅ Barra de busca funcionando
- ✅ Botões "Export CSV" e "Refresh"
- ✅ Tabela com colunas: Name, Email, Phone, Quiz Result, Date
- ✅ Ao clicar em uma linha, abre modal com detalhes
- ✅ Modal mostra: Name, Email, Phone, Quiz Result, Submitted, User Journey

**Como testar:**
1. Acesse um quiz existente: `/quizzes/[ID]/leads`
2. Verifique se os cards de estatísticas aparecem
3. Teste a busca digitando um nome ou email
4. Clique em uma linha da tabela para ver o modal
5. Teste o botão "Export CSV"

**Nota**: Se não houver leads, a tabela mostrará "No leads found..."

---

### 4. **Página de Analytics** (`/quizzes/[id]/analytics`)

**URL**: `http://localhost:3000/quizzes/[QUIZ_ID]/analytics`

**O que verificar:**
- ✅ Fundo escuro (#0f172a)
- ✅ Título "Quiz Analytics Dashboard"
- ✅ 4 cards de métricas no topo:
  - Total Visitors (card azul destacado)
  - Quiz Started
  - Quiz Completed
  - Total Leads (card azul destacado)
- ✅ Seção "Conversion Funnel" com tabela:
  - Colunas: Stage, Count, Rate (%), Progress
  - Linhas: Visitors, Quiz Started, Quiz Completed, Leads Generated
  - Barras de progresso visuais
- ✅ Seção "Performance Metrics" com 2 gráficos:
  - Gráfico de barras "Conversion Funnel" (Chart.js)
  - Gráfico de barras "Top 3 Abandonment Questions" (Chart.js)
- ✅ Seção "Abandonment by Question" com tabela:
  - Colunas: Question ID, Views, Abandonments, Abandon Rate, Avg Time (s)
  - Badges coloridos (vermelho/amarelo/verde) para taxas de abandono

**Como testar:**
1. Acesse um quiz existente: `/quizzes/[ID]/analytics`
2. Verifique se os cards mostram números corretos
3. Verifique se os gráficos aparecem (Chart.js carregado via CDN)
4. Verifique se a tabela de abandono mostra dados
5. A página deve atualizar automaticamente a cada 10 segundos

**Nota**: Os gráficos só aparecem se houver dados. Se não houver eventos, os gráficos podem estar vazios.

---

### 5. **Verificar Estilo Visual**

Todas as páginas devem ter:
- ✅ Fundo escuro (#0f172a ou gradiente)
- ✅ Texto claro (#e2e8f0, #f1f5f9)
- ✅ Cards com borda (#334155)
- ✅ Botões com gradiente azul
- ✅ Fontes: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto

---

### 6. **Verificar Funcionalidades**

#### Autenticação
- ✅ Usuários não autenticados são redirecionados para `/auth/login`
- ✅ Admins são redirecionados para `/admin/users` ao acessar páginas de usuário
- ✅ Apenas usuários podem criar quizzes e ver analytics

#### APIs
- ✅ `/api/quiz/register` - Criar quiz
- ✅ `/api/quiz/[id]/analytics` - Buscar analytics
- ✅ `/api/quiz/[id]/leads` - Buscar leads
- ✅ `/api/lead/[lead_id]` - Buscar detalhes do lead

---

### 7. **Troubleshooting**

#### Servidor não inicia (lock error)
```bash
pnpm run clean:dev
pnpm dev
```

#### Gráficos não aparecem
- Verifique se Chart.js está carregando (console do navegador)
- Verifique se há dados no quiz
- Verifique a conexão com CDN

#### Leads não aparecem
- Verifique se há leads no banco de dados
- Verifique se o quiz_id está correto
- Verifique os logs do servidor

#### Estilo não está correto
- Limpe o cache do navegador (Ctrl+Shift+R)
- Verifique se não há conflitos com Tailwind CSS
- Verifique se os estilos inline estão sendo aplicados

---

### 8. **Checklist Rápido**

- [ ] Servidor rodando em `http://localhost:3000`
- [ ] Login funcionando
- [ ] Página `/quizzes/new` com estilo do template
- [ ] Página `/quizzes/[id]/leads` com estilo do template
- [ ] Página `/quizzes/[id]/analytics` com estilo do template
- [ ] Gráficos Chart.js carregando
- [ ] Modal de detalhes do lead funcionando
- [ ] Exportação CSV funcionando
- [ ] Busca de leads funcionando
- [ ] Auto-refresh funcionando (analytics a cada 10s, leads a cada 30s)

---

## 🎯 URLs Diretas para Teste

1. **Landing Page**: `http://localhost:3000/`
2. **Login**: `http://localhost:3000/auth/login`
3. **Dashboard**: `http://localhost:3000/dashboard`
4. **Criar Quiz**: `http://localhost:3000/quizzes/new`
5. **Listar Quizzes**: `http://localhost:3000/quizzes`
6. **Analytics**: `http://localhost:3000/quizzes/[QUIZ_ID]/analytics`
7. **Leads**: `http://localhost:3000/quizzes/[QUIZ_ID]/leads`

**Nota**: Substitua `[QUIZ_ID]` pelo ID real de um quiz criado.

