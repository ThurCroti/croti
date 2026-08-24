/* Expõe os bundles UMD de forma explícita para os módulos do portfólio. */
if (typeof supabase !== "undefined") window.supabase = supabase;
if (typeof tus !== "undefined") window.tus = tus;
