-- ============================================
-- SCRIPT 2 - Criar Políticas RLS
-- Execute este DEPOIS do script 001
-- ============================================

-- Políticas para quizzes
CREATE POLICY IF NOT EXISTS "Users can view their own quizzes" 
  ON public.quizzes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own quizzes" 
  ON public.quizzes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own quizzes" 
  ON public.quizzes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own quizzes" 
  ON public.quizzes FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para sessions
CREATE POLICY IF NOT EXISTS "Allow public insert for tracking" 
  ON public.sessions FOR INSERT 
  WITH CHECK (TRUE);

CREATE POLICY IF NOT EXISTS "Users can view sessions of their quizzes" 
  ON public.sessions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE id = sessions.quiz_id AND user_id = auth.uid()
    )
  );

-- Políticas para events
CREATE POLICY IF NOT EXISTS "Allow public insert for tracking" 
  ON public.events FOR INSERT 
  WITH CHECK (TRUE);

CREATE POLICY IF NOT EXISTS "Users can view events of their quiz sessions" 
  ON public.events FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s 
      JOIN public.quizzes q ON s.quiz_id = q.id 
      WHERE s.id = events.session_id AND q.user_id = auth.uid()
    )
  );

-- Políticas para leads
CREATE POLICY IF NOT EXISTS "Allow public insert for lead capture" 
  ON public.leads FOR INSERT 
  WITH CHECK (TRUE);

CREATE POLICY IF NOT EXISTS "Users can view leads from their quizzes" 
  ON public.leads FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE id = leads.quiz_id AND user_id = auth.uid()
    )
  );

