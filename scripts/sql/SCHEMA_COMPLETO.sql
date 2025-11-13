-- ============================================
-- SCHEMA COMPLETO - Execute este script no Supabase SQL Editor
-- ============================================

-- ============================================
-- PARTE 1: Criar Tabelas
-- ============================================

-- Tabela quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  tracking_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_session_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  question_number INTEGER,
  answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PARTE 2: Ativar RLS
-- ============================================

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 3: Políticas RLS - Quizzes
-- ============================================

DROP POLICY IF EXISTS "Users can view their own quizzes" ON public.quizzes;
CREATE POLICY "Users can view their own quizzes" 
  ON public.quizzes FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quizzes" ON public.quizzes;
CREATE POLICY "Users can insert their own quizzes" 
  ON public.quizzes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quizzes" ON public.quizzes;
CREATE POLICY "Users can update their own quizzes" 
  ON public.quizzes FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own quizzes" ON public.quizzes;
CREATE POLICY "Users can delete their own quizzes" 
  ON public.quizzes FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- PARTE 4: Políticas RLS - Sessions
-- ============================================

DROP POLICY IF EXISTS "Allow public insert for tracking" ON public.sessions;
CREATE POLICY "Allow public insert for tracking" 
  ON public.sessions FOR INSERT 
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can view sessions of their quizzes" ON public.sessions;
CREATE POLICY "Users can view sessions of their quizzes" 
  ON public.sessions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE id = sessions.quiz_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- PARTE 5: Políticas RLS - Events
-- ============================================

DROP POLICY IF EXISTS "Allow public insert for tracking" ON public.events;
CREATE POLICY "Allow public insert for tracking" 
  ON public.events FOR INSERT 
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can view events of their quiz sessions" ON public.events;
CREATE POLICY "Users can view events of their quiz sessions" 
  ON public.events FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s 
      JOIN public.quizzes q ON s.quiz_id = q.id 
      WHERE s.id = events.session_id AND q.user_id = auth.uid()
    )
  );

-- ============================================
-- PARTE 6: Políticas RLS - Leads
-- ============================================

DROP POLICY IF EXISTS "Allow public insert for lead capture" ON public.leads;
CREATE POLICY "Allow public insert for lead capture" 
  ON public.leads FOR INSERT 
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can view leads from their quizzes" ON public.leads;
CREATE POLICY "Users can view leads from their quizzes" 
  ON public.leads FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE id = leads.quiz_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- PARTE 7: Políticas RLS - User Profiles
-- ============================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = id);

-- Função auxiliar para verificar se usuário é admin (evita recursão)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = user_id;
  RETURN user_role = 'admin';
END;
$$;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" 
  ON public.user_profiles FOR SELECT 
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
CREATE POLICY "Admins can insert profiles" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

-- Permitir inserção automática via trigger (sem verificação de admin)
-- A função handle_new_user usa SECURITY DEFINER, então pode inserir mesmo sem política

-- ============================================
-- PARTE 8: Função e Trigger para criar perfil automaticamente
-- ============================================

-- Função para criar perfil quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Verificar tabelas criadas
SELECT 
    'Schema aplicado!' as status,
    COUNT(*) as total_tabelas
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('quizzes', 'sessions', 'events', 'leads', 'user_profiles');

