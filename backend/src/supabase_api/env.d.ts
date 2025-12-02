declare namespace NodeJS {
  interface ProcessEnv {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_DB_PASSWORD: string;
    ENCRYPTION_KEY: string;
  }
}
