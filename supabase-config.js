/*
 * Copie a URL e a chave anon/public em:
 * Supabase > Project Settings > API.
 * A chave anon pode ficar no navegador; a segurança é garantida pelas policies RLS.
 */
window.CROTI_SUPABASE = {
    url: "https://zsrqnfsbrsvnamywvbvk.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcnFuZnNicnN2bmFteXd2YnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNjAyODcsImV4cCI6MjEwMjkzNjI4N30.VxjBYUb9OCT4VomRAUA_AXilUaQtoZmxXfRPL47bPPo",
    // O plano gratuito do Supabase aceita no máximo 50 MB por arquivo.
    maxUploadMB: 50
};
