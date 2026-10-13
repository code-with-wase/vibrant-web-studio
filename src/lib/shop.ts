import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export const shopQuery = queryOptions({ queryKey: ['shop'], queryFn: async () => {
  const results = await Promise.all([
    supabase.from('products').select('*, brands(name), categories(name)').order('created_at', { ascending: false }),
    supabase.from('brands').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
    supabase.from('invoices').select('*, invoice_items(*)').order('created_at', { ascending: false }),
    supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(100),
  ]);
  const error = results.find(r => r.error)?.error; if (error) throw new Error(error.message);
  return { products: results[0].data ?? [], brands: results[1].data ?? [], categories: results[2].data ?? [], invoices: results[3].data ?? [], movements: results[4].data ?? [] };
} });
export type ShopData = Awaited<ReturnType<typeof shopQuery.queryFn extends (...args: never[]) => infer R ? () => R : never>>;
export const money = (value: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
export const sections = ['dashboard','products','brands','categories','stock','billing','invoices','low-stock','reports','admins'] as const;
export const titles: Record<string,string> = { dashboard:'Dashboard', products:'Products', brands:'Brands', categories:'Categories', stock:'Stock management', billing:'New billing', invoices:'Invoices', 'low-stock':'Low stock', reports:'Sales reports', admins:'Administrators' };