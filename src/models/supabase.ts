import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uhxbgqfpmvqcgxvykguk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeGJncWZwbXZxY2d4dnk5Z3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDYwODcsImV4cCI6MjA2NDUyMjA4N30.eVTb0T3n9JbN9VHK7b8pTQy2m9WwDy9cK0H2jE1qLKM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
