// Client for the DC Management Express API (hosted on Vercel).
// Every endpoint of the backend is wrapped here; the rest of the app only talks to this module.
export const API_URL = ((import.meta.env['VITE_API_URL'] as string | undefined) || 'https://dc-management-nine.vercel.app').replace(/\/$/, '');
const TOKEN_KEY = 'dc-token';

export type Named = { id: string; name: string };
export type Product = { id: string; name: string; sku: string; size: string; color: string; price: number; low_stock: number; stock: number; brand_id: string | null; category_id: string | null; created_at: string; brands: { name: string } | null; categories: { name: string } | null };
export type InvoiceItem = { id: string; product_id: string; name: string; quantity: number; price: number; brand?: string; size?: string; color?: string };
export type Invoice = { id: string; number: number; customer: string; payment: string; status: string; total: number; created_at: string; invoice_items: InvoiceItem[] };
export type Movement = { id: string; product_id: string | null; product_name: string; change: number; note: string; created_at: string };
export type Admin = { id: string; email: string; role: string; created_at: string };
export type User = { id: string; email: string; role: string; created_at?: string };
export type ShopData = { products: Product[]; brands: Named[]; categories: Named[]; invoices: Invoice[]; movements: Movement[] };
export type Dashboard = { todaySales: number; totalProducts: number; unitsInStock: number; totalInvoices: number; paidInvoices: number; lowStockCount: number; lowStockProducts: Product[]; recentInvoices: Invoice[] };
export type SalesReport = { from: string; to: string; period: string; sales: number; paidInvoices: number; cancelledInvoices: number; revenue: { period: string; count: number; total: number }[]; products: { name: string; quantity: number; total: number }[] };

const getToken = () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY));
type Listener = (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED') => void;
const listeners = new Set<Listener>();
const emit = (e: Parameters<Listener>[0]) => listeners.forEach(l => l(e));

async function request<T>(path: string, init: { method?: string; body?: unknown; query?: Record<string, string | undefined>; public?: boolean } = {}): Promise<T> {
  const qs = init.query ? Object.entries(init.query).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`).join('&') : '';
  const token = init.public ? null : getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${qs ? `?${qs}` : ''}`, {
      method: init.method ?? 'GET',
      headers: { ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : null,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your internet connection.');
  }
  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: { message?: string } };
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/login')) { localStorage.removeItem(TOKEN_KEY); emit('SIGNED_OUT'); }
    throw new Error(json.error?.message || `Request failed (${res.status})`);
  }
  return json.data as T;
}
type Res<T = null> = { data: T | null; error: { message: string } | null };
async function wrap<T>(p: Promise<T>): Promise<Res<T>> { try { return { data: await p, error: null }; } catch (e) { return { data: null, error: { message: e instanceof Error ? e.message : 'Something went wrong' } }; } }

const base = { products: '/product', brands: '/brand', categories: '/category' } as const;
type Table = keyof typeof base;

export const api = {
  // Product / Brand / Category CRUD
  from: (table: Table) => ({
    insert: (row: object) => wrap(request(`${base[table]}/create`, { method: 'POST', body: row })),
    update: (row: object) => ({ eq: (_c: 'id', id: string) => wrap(request(`${base[table]}/${id}/update`, { method: 'PATCH', body: row })) }),
    delete: () => ({ eq: (_c: 'id', id: string) => wrap(request(`${base[table]}/${id}/delete`, { method: 'DELETE' })) }),
  }),
  products: (q: { search?: string; category_id?: string; lowStock?: boolean } = {}) => request<Product[]>('/product/all', { query: { search: q.search, category_id: q.category_id, lowStock: q.lowStock ? 'true' : undefined } }),
  brands: () => request<Named[]>('/brand/all'),
  categories: () => request<Named[]>('/category/all'),
  // Shop + dashboard + reports
  readAll: () => request<ShopData>('/shop/data'),
  dashboard: () => request<Dashboard>('/dashboard/overview'),
  report: (q: { from?: string; to?: string; period: string }) => request<SalesReport>('/report/sales', { query: q }),
  // Stock
  movements: (limit = 50) => request<Movement[]>('/stock/movements', { query: { limit: String(limit) } }),
  adjustStock: (b: { product_id: string; change: number; note?: string | undefined }) => request('/stock/adjust', { method: 'POST', body: b }),
  // Invoices
  invoices: () => request<Invoice[]>('/invoice/all'),
  getInvoice: (id: string) => request<Invoice>(`/invoice/${id}`),
  saveInvoice: (b: { customer: string; payment: string; items: { product_id: string; quantity: number; price: number }[] }, id?: string | null) =>
    id ? request<Invoice>(`/invoice/${id}/update`, { method: 'PUT', body: b }) : request<Invoice>('/invoice/create', { method: 'POST', body: b }),
  cancelInvoice: (id: string, del = false) => request(`/invoice/${id}/cancel`, { method: 'POST', body: { delete: del } }),
  // Kept for existing call sites
  rpc: (fn: string, a: { _user_id?: string; _role?: string; p_id?: string; p_change?: number; p_note?: string; p_items?: { product_id: string; quantity: number; price: number }[]; p_customer?: string; p_payment?: string; p_delete?: boolean }) => {
    if (fn === 'adjust_stock') return wrap(api.adjustStock({ product_id: a.p_id!, change: Number(a.p_change), note: a.p_note }));
    if (fn === 'save_invoice') return wrap(api.saveInvoice({ customer: a.p_customer ?? '', payment: a.p_payment ?? 'Cash', items: (a.p_items ?? []).map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })) }, a.p_id));
    if (fn === 'cancel_invoice') return wrap(api.cancelInvoice(a.p_id!, a.p_delete));
    if (fn === 'has_role') return wrap(request<User>('/auth/me').then(u => u.role === 'admin'));
    return Promise.resolve({ data: null, error: { message: 'Unknown action' } });
  },
  // Admins
  async admins(create?: { email?: string; password?: string }) {
    if (create?.email) await request('/admin/create', { method: 'POST', body: { email: create.email, password: create.password } });
    return request<Admin[]>('/admin/all');
  },
  // Auth
  auth: {
    async getUser() {
      if (!getToken()) return { data: { user: null }, error: null };
      try { const u = await request<User>('/auth/me'); return { data: { user: u }, error: null }; } catch { return { data: { user: null }, error: null }; }
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try { const r = await request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { email, password } }); localStorage.setItem(TOKEN_KEY, r.token); emit('SIGNED_IN'); return { error: null }; }
      catch (e) { return { error: e instanceof Error ? e : new Error('Sign in failed') }; }
    },
    async signOut() { try { if (getToken()) await request('/auth/logout', { method: 'POST' }); } catch { /* ignore */ } localStorage.removeItem(TOKEN_KEY); emit('SIGNED_OUT'); return { error: null }; },
    async updatePassword(b: { currentPassword: string; newPassword: string }) { await request('/auth/password/update', { method: 'PATCH', body: b }); emit('USER_UPDATED'); },
    resetPasswordForEmail(email: string) { return wrap(request<{ message: string }>('/auth/password/forgot', { method: 'POST', body: { email: email.trim() }, public: true })); },
    resetPassword(b: { email: string; token: string; newPassword: string }) { return wrap(request<{ message: string }>('/auth/password/reset', { method: 'POST', body: b, public: true })); },
    async updateUser(_o: { password: string }) { return { error: { message: 'Sign in and use “Change password” in Administrators.' } }; },
    onAuthStateChange(cb: Listener) { listeners.add(cb); return { data: { subscription: { unsubscribe: () => { listeners.delete(cb); } } } }; },
  },
};
