import { queryOptions } from '@tanstack/react-query';
import { localDb } from '@/lib/local-db';
export const shopQuery = queryOptions({ queryKey: ['shop'], queryFn: async () => localDb.readAll() });
export type ShopData = ReturnType<typeof localDb.readAll>;
export const money = (value: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
export const sections = ['dashboard','products','brands','categories','stock','billing','invoices','low-stock','reports','admins'] as const;
export const titles: Record<string,string> = { dashboard:'Dashboard', products:'Products', brands:'Brands', categories:'Categories', stock:'Stock management', billing:'New billing', invoices:'Invoices', 'low-stock':'Low stock', reports:'Sales reports', admins:'Administrators' };
