import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
export const Route=createFileRoute('/_authenticated')({ssr:false,beforeLoad:async()=>{const {data,error}=await supabase.auth.getUser();if(error||!data.user)throw redirect({to:'/'});const role=await supabase.rpc('has_role',{_user_id:data.user.id,_role:'admin'});return {admin:role.data===true,email:data.user.email??''};},component:()=> <Outlet/>});
