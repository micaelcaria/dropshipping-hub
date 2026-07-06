import { createClient } from '@supabase/supabase-js';
// Supabase dedicado ainda não configurado — usar placeholder para o arranque não falhar
export const supabase = createClient(process.env.SUPABASE_URL || 'http://supabase-nao-configurado.local', process.env.SUPABASE_SERVICE_KEY || 'placeholder');
export const supabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
