import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
export const shopQuery = queryOptions({ queryKey: ['shop'], queryFn: () => api.readAll() });
export const dashboardQuery = queryOptions({ queryKey: ['dashboard'], queryFn: () => api.dashboard() });
export type { ShopData } from '@/lib/api';
export const money = (value: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
export const sections = ['dashboard','products','brands','categories','billing','invoices','low-stock','reports','admins'] as const;
export const titles: Record<string,string> = { dashboard:'Dashboard', products:'Products', brands:'Brands', categories:'Categories', billing:'New billing', invoices:'Invoices', 'low-stock':'Low stock', reports:'Sales reports', admins:'Administrators' };
