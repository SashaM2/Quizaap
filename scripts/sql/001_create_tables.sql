-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  tracking_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table (quiz interactions)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_session_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create events table (user interactions)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  question_number INTEGER,
  answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes
CREATE POLICY "Users can view their own quizzes" ON public.quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quizzes" ON public.quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quizzes" ON public.quizzes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quizzes" ON public.quizzes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sessions (allow public read for tracking, but user can manage their quiz's sessions)
CREATE POLICY "Allow public insert for tracking" ON public.sessions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can view sessions of their quizzes" ON public.sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quizzes WHERE id = sessions.quiz_id AND user_id = auth.uid())
);

-- RLS Policies for events
CREATE POLICY "Allow public insert for tracking" ON public.events FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can view events of their quiz sessions" ON public.events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sessions s JOIN public.quizzes q ON s.quiz_id = q.id WHERE s.id = events.session_id AND q.user_id = auth.uid())
);

-- RLS Policies for leads
CREATE POLICY "Allow public insert for lead capture" ON public.leads FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can view leads from their quizzes" ON public.leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quizzes WHERE id = leads.quiz_id AND user_id = auth.uid())
);
