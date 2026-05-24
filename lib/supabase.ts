/**
 * @deprecated lib/supabase.ts is the legacy browser-only client.
 *
 * Please migrate to the new split clients:
 *   - "use client" components → import { createClient } from "@/lib/supabase/client"
 *   - Server components / Route Handlers / Server Actions → import { createClient } from "@/lib/supabase/server"
 *
 * The legacy export below is kept to avoid breaking existing imports while the
 * migration is in progress. It will be removed once all usages are updated.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);