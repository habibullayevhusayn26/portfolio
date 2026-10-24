export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";
export const ADMIN_EMAIL = "";

export const isSupabaseConfigured = Boolean(
    SUPABASE_URL && SUPABASE_ANON_KEY && ADMIN_EMAIL
);
