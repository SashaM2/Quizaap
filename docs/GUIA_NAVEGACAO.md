# 🧭 Guia Completo de Navegação

## 📍 Páginas Disponíveis

### 🔐 Autenticação

#### 1. **Login** (`/auth/login`)
- **URL**: `http://localhost:3000/auth/login`
- **Acesso**: Público (qualquer pessoa)
- **Função**: Fazer login no sistema
- **Como acessar**:
  - Digite a URL diretamente
  - Ou acesse `/` sem estar logado (redirecionamento automático)

#### 2. **Registro** (`/auth/register`)
- **URL**: `http://localhost:3000/auth/register`
- **Acesso**: Apenas Administradores
- **Função**: Criar novos usuários no sistema
- **Como acessar**:
  - Faça login como admin
  - Clique em "Criar Usuário" no menu superior
  - Ou digite a URL diretamente (será verificado se é admin)

---

### 🏠 Dashboard Principal

#### 3. **Dashboard** (`/`)
- **URL**: `http://localhost:3000`
- **Acesso**: Usuários autenticados (admin ou user)
- **Função**: Visualizar estatísticas e métricas
- **Conteúdo**:
  - Total de Quizzes
  - Total de Sessões
  - Total de Leads
  - Taxa de Conversão
- **Como acessar**:
  - Após fazer login, redirecionamento automático
  - Clique em "Dashboard" no menu superior
  - Ou digite `/` na URL

---

### 👥 Administração (Apenas Admin)

#### 4. **Gerenciar Usuários** (`/admin/users`)
- **URL**: `http://localhost:3000/admin/users`
- **Acesso**: Apenas Administradores
- **Função**: Gerenciar todos os usuários do sistema
- **Funcionalidades**:
  - Ver todos os usuários
  - Buscar usuários por email
  - Filtrar por função (admin/user)
  - Editar role de usuários
  - Deletar usuários
  - Ver estatísticas (total, admins, usuários)
- **Como acessar**:
  - Faça login como admin
  - Clique em "Gerenciar Usuários" no menu superior
  - Ou clique no botão "Gerenciar Usuários" no dashboard
  - Ou digite a URL diretamente

#### 5. **Debug** (`/admin/debug`)
- **URL**: `http://localhost:3000/admin/debug`
- **Acesso**: Público (mas útil para admins)
- **Função**: Ver informações de debug do sistema
- **Conteúdo**:
  - Informações do usuário autenticado
  - Perfil do usuário
  - Status de administrador
  - Variáveis de ambiente configuradas
- **Como acessar**:
  - Faça login (qualquer usuário)
  - Clique em "Debug" no menu superior (apenas para admins)
  - Ou digite a URL diretamente

---

## 🗺️ Mapa de Navegação

```
┌─────────────────────────────────────────────────┐
│              PÁGINA DE LOGIN                    │
│              /auth/login                         │
└──────────────────┬──────────────────────────────┘
                   │
                   │ (Login bem-sucedido)
                   ▼
┌─────────────────────────────────────────────────┐
│              DASHBOARD                          │
│              /                                  │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐          │
│  │  Quizzes     │  │  Sessões     │          │
│  └──────────────┘  └──────────────┘          │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐          │
│  │  Leads       │  │  Conversão   │          │
│  └──────────────┘  └──────────────┘          │
│                                                 │
│  [Gerenciar Usuários] ← (Apenas Admin)        │
└──────────────────┬──────────────────────────────┘
                   │
                   │ (Se Admin)
                   ▼
┌─────────────────────────────────────────────────┐
│         GERENCIAR USUÁRIOS                      │
│         /admin/users                            │
│                                                 │
│  [Buscar] [Filtrar] [Criar Novo]              │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │  Tabela de Usuários                 │       │
│  │  - Email                            │       │
│  │  - Função                           │       │
│  │  - Data de Criação                 │       │
│  │  - Ações (Editar/Deletar)          │       │
│  └─────────────────────────────────────┘       │
└──────────────────┬──────────────────────────────┘
                   │
                   │ (Criar Novo Usuário)
                   ▼
┌─────────────────────────────────────────────────┐
│         CRIAR USUÁRIO                           │
│         /auth/register                          │
│                                                 │
│  [Formulário de Registro]                       │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Como Navegar

### Método 1: Menu Superior (Recomendado)

Após fazer login, você verá um menu superior com:

- **Dashboard** - Voltar para a página principal
- **Gerenciar Usuários** - (Apenas Admin) Gerenciar usuários
- **Criar Usuário** - (Apenas Admin) Criar novo usuário
- **Debug** - (Apenas Admin) Informações de debug
- **Seu Email** - Mostra seu email logado
- **Admin** (badge) - (Apenas Admin) Indica que você é admin
- **Sair** - Fazer logout

### Método 2: Botões no Dashboard

No dashboard principal, há um botão:

- **"Gerenciar Usuários"** - (Apenas Admin) Leva para `/admin/users`

### Método 3: URL Direta

Você pode digitar diretamente na barra de endereços:

- `http://localhost:3000` - Dashboard
- `http://localhost:3000/auth/login` - Login
- `http://localhost:3000/admin/users` - Gerenciar Usuários (apenas admin)
- `http://localhost:3000/auth/register` - Criar Usuário (apenas admin)
- `http://localhost:3000/admin/debug` - Debug

---

## 🔒 Permissões por Página

| Página | Usuário Comum | Admin |
|--------|---------------|-------|
| `/auth/login` | ✅ | ✅ |
| `/` (Dashboard) | ✅ | ✅ |
| `/admin/users` | ❌ | ✅ |
| `/auth/register` | ❌ | ✅ |
| `/admin/debug` | ✅ | ✅ |

---

## 🚀 Fluxo Típico de Uso

### Para Administradores:

1. **Acessar Login**: `http://localhost:3000/auth/login`
2. **Fazer Login**: Email e senha de admin
3. **Ver Dashboard**: Estatísticas gerais
4. **Gerenciar Usuários**: Criar, editar ou deletar usuários
5. **Criar Novos Usuários**: Via "Criar Usuário" no menu

### Para Usuários Comuns:

1. **Acessar Login**: `http://localhost:3000/auth/login`
2. **Fazer Login**: Email e senha do usuário
3. **Ver Dashboard**: Suas próprias estatísticas
4. **Usar Funcionalidades**: (Quando implementadas)

---

## 📱 Menu Responsivo

O menu superior é responsivo:

- **Desktop**: Menu completo visível
- **Mobile**: Menu pode estar oculto (use o menu hambúrguer se implementado)

---

## 💡 Dicas de Navegação

1. **Sempre comece pelo Login**: `/auth/login`
2. **Use o Menu Superior**: É a forma mais fácil de navegar
3. **Verifique Permissões**: Algumas páginas só funcionam para admins
4. **Debug Útil**: Use `/admin/debug` para verificar seu status

---

## ⚠️ Problemas Comuns

### "Não consigo acessar `/admin/users`"

**Causa**: Você não é administrador

**Solução**:
1. Verifique seu status em `/admin/debug`
2. Se não for admin, peça a um admin para tornar você admin
3. Ou execute no Supabase SQL Editor:
   ```sql
   UPDATE public.user_profiles 
   SET role = 'admin' 
   WHERE email = 'seu-email@exemplo.com';
   ```

### "Menu não aparece"

**Causa**: Pode ser cache do navegador

**Solução**:
1. Limpe o cache (Ctrl+Shift+Delete)
2. Recarregue a página (F5)
3. Faça logout e login novamente

### "Redirecionado para `/auth/login`"

**Causa**: Sessão expirada ou não autenticado

**Solução**:
1. Faça login novamente
2. Verifique se o servidor está rodando (`pnpm dev`)

---

## 🎉 Pronto!

Agora você sabe como navegar por todas as páginas do sistema. Use o menu superior para facilitar a navegação!

