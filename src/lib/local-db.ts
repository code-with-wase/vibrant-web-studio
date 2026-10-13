// Frontend-only data store (browser localStorage). Mirrors the small slice of the
// backend client API that the app uses, so a real backend can be swapped back in later.
export type Brand = { id: string; name: string };
export type Product = { id: string; name: string; sku: string; size: string; color: string; price: number; low_stock: number; stock: number; brand_id: string | null; category_id: string | null; created_at: string };
export type InvoiceItem = { id: string; invoice_id: string; product_id: string; name: string; quantity: number; price: number };
export type Invoice = { id: string; number: number; customer: string; payment: string; status: string; total: number; created_at: string };
export type Movement = { id: string; product_id: string | null; product_name: string; change: number; note: string; created_at: string };
export type Admin = { id: string; email: string; password: string; created_at: string };
type DB = { brands: Brand[]; categories: Brand[]; products: Product[]; invoices: Invoice[]; invoice_items: InvoiceItem[]; stock_movements: Movement[]; admins: Admin[]; session: string | null };

export const DEMO_EMAIL = 'admin@deluxeculture.com';
export const DEMO_PASSWORD = 'Deluxe@12345';
const KEY = 'deluxe-culture-db';
const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const now = () => new Date().toISOString();

function seed(): DB {
  const b1 = { id: uid(), name: 'Deluxe Signature' }, b2 = { id: uid(), name: 'Urban Gentleman' };
  const c1 = { id: uid(), name: 'Shirts' }, c2 = { id: uid(), name: 'Blazers' }, c3 = { id: uid(), name: 'Trousers' };
  const p = (name: string, sku: string, size: string, color: string, price: number, stock: number, b: Brand, c: Brand): Product => ({ id: uid(), name, sku, size, color, price, stock, low_stock: 5, brand_id: b.id, category_id: c.id, created_at: now() });
  return { brands: [b1, b2], categories: [c1, c2, c3], products: [p('Classic Oxford Shirt', 'DC-SH-01', 'M', 'White', 1899, 24, b1, c1), p('Slim Linen Shirt', 'DC-SH-02', 'L', 'Beige', 2199, 3, b2, c1), p('Velvet Dinner Blazer', 'DC-BL-01', '40', 'Black', 8999, 6, b1, c2), p('Tailored Chinos', 'DC-TR-01', '32', 'Navy', 2499, 2, b2, c3)], invoices: [], invoice_items: [], stock_movements: [], admins: [{ id: uid(), email: DEMO_EMAIL, password: DEMO_PASSWORD, created_at: now() }], session: null };
}
function load(): DB {
  if (typeof window === 'undefined') return seed();
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) as DB; } catch { /* reset below */ }
  const db = seed(); localStorage.setItem(KEY, JSON.stringify(db)); return db;
}
function save(db: DB) { localStorage.setItem(KEY, JSON.stringify(db)); }
type Res<T = null> = { data: T; error: { message: string } | null };
const ok = <T,>(data: T): Res<T> => ({ data, error: null });
const fail = (message: string): Res<null> => ({ data: null, error: { message } });

type Table = 'products' | 'brands' | 'categories';
function table(name: Table) {
  return {
    insert: async (row: Partial<Product>) => { const db = load(); const list = db[name] as unknown as Partial<Product>[]; if (name !== 'products' && list.some(r => String(r.name).toLowerCase() === String(row.name).toLowerCase())) return fail('This name already exists'); if (name === 'products' && list.some(r => r.sku === row.sku)) return fail('SKU already exists'); list.push({ ...row, id: uid(), created_at: now() } as Partial<Product>); save(db); return ok(null); },
    update: (row: Partial<Product>) => ({ eq: async (_c: 'id', id: string) => { const db = load(); const list = db[name] as unknown as Partial<Product>[]; const i = list.findIndex(r => r.id === id); if (i < 0) return fail('Not found'); list[i] = { ...list[i], ...row }; save(db); return ok(null); } }),
    delete: () => ({ eq: async (_c: 'id', id: string) => { const db = load(); (db as unknown as Record<Table, { id: string }[]>)[name] = db[name].filter(r => r.id !== id); if (name !== 'products') for (const p of db.products) { if (name === 'brands' && p.brand_id === id) p.brand_id = null; if (name === 'categories' && p.category_id === id) p.category_id = null; } save(db); return ok(null); } }),
  };
}
type Listener = (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED') => void;
const listeners = new Set<Listener>();
const emit = (e: Parameters<Listener>[0]) => listeners.forEach(l => l(e));

type RpcArgs = { _user_id?: string; _role?: string; p_id?: string; p_change?: number; p_note?: string; p_items?: unknown; p_customer?: string; p_payment?: string; p_delete?: boolean };
async function rpc(fn: string, a: RpcArgs): Promise<Res<unknown>> {
  const db = load();
  if (fn === 'has_role') return ok(db.admins.some(x => x.id === a._user_id));
  if (fn === 'adjust_stock') {
    const p = db.products.find(x => x.id === a.p_id); const change = Number(a.p_change);
    if (!p) return fail('Select a product'); if (!change) return fail('Enter a quantity change'); if (p.stock + change < 0) return fail('Stock cannot go below zero');
    p.stock += change; db.stock_movements.unshift({ id: uid(), product_id: p.id, product_name: p.name, change, note: String(a.p_note || 'Manual adjustment'), created_at: now() }); save(db); return ok(null);
  }
  if (fn === 'save_invoice') {
    const items = a.p_items as { product_id: string; name: string; quantity: number; price: number }[];
    if (!items.length) return fail('Add at least one product');
    const existing = a.p_id ? db.invoices.find(i => i.id === a.p_id) : undefined;
    const restore = existing ? db.invoice_items.filter(i => i.invoice_id === existing.id) : [];
    const stockAfter = new Map(db.products.map(p => [p.id, p.stock]));
    for (const r of restore) stockAfter.set(r.product_id, (stockAfter.get(r.product_id) ?? 0) + r.quantity);
    for (const it of items) { const s = (stockAfter.get(it.product_id) ?? 0) - it.quantity; if (s < 0) return fail(`Not enough stock for ${it.name}`); stockAfter.set(it.product_id, s); }
    for (const p of db.products) { const s = stockAfter.get(p.id)!; if (s !== p.stock) db.stock_movements.unshift({ id: uid(), product_id: p.id, product_name: p.name, change: s - p.stock, note: existing ? 'Invoice edited' : 'Invoice sale', created_at: now() }); p.stock = s; }
    const total = items.reduce((t, i) => t + i.quantity * i.price, 0);
    const inv: Invoice = existing ?? { id: uid(), number: db.invoices.reduce((m, i) => Math.max(m, i.number), 0) + 1, customer: '', payment: '', status: 'paid', total: 0, created_at: now() };
    Object.assign(inv, { customer: String(a.p_customer), payment: String(a.p_payment), total, status: 'paid' });
    if (!existing) db.invoices.unshift(inv);
    db.invoice_items = db.invoice_items.filter(i => i.invoice_id !== inv.id).concat(items.map(i => ({ ...i, id: uid(), invoice_id: inv.id })));
    save(db); return ok(inv.id);
  }
  if (fn === 'cancel_invoice') {
    const inv = db.invoices.find(i => i.id === a.p_id); if (!inv) return fail('Invoice not found');
    if (inv.status !== 'cancelled') for (const it of db.invoice_items.filter(i => i.invoice_id === inv.id)) { const p = db.products.find(x => x.id === it.product_id); if (p) { p.stock += it.quantity; db.stock_movements.unshift({ id: uid(), product_id: p.id, product_name: p.name, change: it.quantity, note: `Invoice DC-${String(inv.number).padStart(4, '0')} cancelled`, created_at: now() }); } }
    if (a.p_delete) { db.invoices = db.invoices.filter(i => i.id !== inv.id); db.invoice_items = db.invoice_items.filter(i => i.invoice_id !== inv.id); } else inv.status = 'cancelled';
    save(db); return ok(null);
  }
  return fail('Unknown action');
}

export const localDb = {
  from: table,
  rpc,
  readAll() {
    const db = load();
    const name = (list: Brand[], id: string | null) => { const f = list.find(x => x.id === id); return f ? { name: f.name } : null; };
    return {
      products: [...db.products].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(p => ({ ...p, brands: name(db.brands, p.brand_id), categories: name(db.categories, p.category_id) })),
      brands: [...db.brands].sort((a, b) => a.name.localeCompare(b.name)),
      categories: [...db.categories].sort((a, b) => a.name.localeCompare(b.name)),
      invoices: [...db.invoices].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(i => ({ ...i, invoice_items: db.invoice_items.filter(x => x.invoice_id === i.id) })),
      movements: db.stock_movements.slice(0, 100),
    };
  },
  admins(create?: { email?: string; password?: string }) {
    const db = load();
    if (create?.email) {
      if (!create.password || create.password.length < 10) throw new Error('Password must be at least 10 characters');
      if (db.admins.some(a => a.email.toLowerCase() === create.email!.toLowerCase())) throw new Error('An admin with this email already exists');
      db.admins.push({ id: uid(), email: create.email.trim(), password: create.password, created_at: now() }); save(db);
    }
    return db.admins.map(({ id, email, created_at }) => ({ id, email, created_at }));
  },
  auth: {
    async getUser() { const db = load(); const u = db.admins.find(a => a.id === db.session); return u ? { data: { user: { id: u.id, email: u.email } }, error: null } : { data: { user: null }, error: null }; },
    async signInWithPassword({ email, password }: { email: string; password: string }) { const db = load(); const u = db.admins.find(a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password); if (!u) return { error: new Error('Invalid login credentials') }; db.session = u.id; save(db); emit('SIGNED_IN'); return { error: null }; },
    async signOut() { const db = load(); db.session = null; save(db); emit('SIGNED_OUT'); return { error: null }; },
    async resetPasswordForEmail(_email: string, _o?: unknown) { return { error: new Error('Password reset by email will work once the backend is connected. Use the test admin login for now.') }; },
    async updateUser(_o: { password: string }) { return { error: { message: 'Password reset will work once the backend is connected.' } }; },
    onAuthStateChange(cb: Listener) { listeners.add(cb); return { data: { subscription: { unsubscribe: () => { listeners.delete(cb); } } } }; },
  },
};
