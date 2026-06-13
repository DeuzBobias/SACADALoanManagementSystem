import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://edkdcsbeozrctltumuoq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVka2Rjc2Jlb3pyY3RsdHVtdW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMTYxNDYsImV4cCI6MjA5Njg5MjE0Nn0.1Gpzx2D2WWMBsybgh5Rtum8PkvHBK_8llzxiv_qoQNY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);