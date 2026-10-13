import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const manageAdmins = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ email: z.string().email().optional(), password: z.string().min(10).optional() }))
  .handler(async ({ data, context }) => {
    const { data: permitted, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (error || !permitted) throw new Error('Admin access required');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    if (data.email) {
      if (!data.password) throw new Error('Password is required');
      const result = await supabaseAdmin.auth.admin.createUser({ email: data.email, password: data.password, email_confirm: true });
      if (result.error || !result.data.user) throw new Error(result.error?.message ?? 'Could not create account');
      const role = await supabaseAdmin.from('user_roles').insert({ user_id: result.data.user.id, role: 'admin' });
      if (role.error) { await supabaseAdmin.auth.admin.deleteUser(result.data.user.id); throw new Error('Could not assign admin permissions'); }
    }
    const roles = await context.supabase.from('user_roles').select('user_id');
    if (roles.error) throw new Error('Could not load admins');
    const ids = new Set(roles.data.map(r => r.user_id));
    const admins: { id: string; email: string; created_at: string }[] = [];
    for (let page = 1; ; page++) {
      const result = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
      if (result.error) throw new Error('Could not load accounts');
      for (const u of result.data.users) if (ids.has(u.id)) admins.push({ id: u.id, email: u.email ?? '', created_at: u.created_at });
      if (result.data.users.length < 100) break;
    }
    return admins;
  });