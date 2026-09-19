import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type RemoteSettings = {
  id: number;
  free_max_customers: number;
  free_max_transactions: number;
  free_max_pdf: number;
  free_max_assistant: number;
  show_ads: boolean;
  allow_cloud_sync_free: boolean;
  allow_biometric_free: boolean;
  price_monthly: number;
  price_3months: number;
  price_6months: number;
  payment_number: string;
  whatsapp_number: string;
  trial_days: number;
  updated_at?: string;
};