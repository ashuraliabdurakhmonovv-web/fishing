import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Shu qiymatlarni o'z Supabase loyihangizdan qo'ying.
const SUPABASE_URL = "https://qhpencwjbhzkkhrqujpm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFocGVuY3dqYmh6a2tocnF1anBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzI5OTQsImV4cCI6MjA5MDI0ODk5NH0.hzFIDmlGHHmVCoYSw5lr9yZ5dhEmIC_LMkBgeQMgOR4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
