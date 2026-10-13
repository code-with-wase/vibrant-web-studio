import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { localDb as db } from '@/lib/local-db';
export const Route=createFileRoute('/_authenticated')({ssr:false,beforeLoad:async()=>{const {data,error}=await db.auth.getUser();if(error||!data.user)throw redirect({to:'/'});const role=await db.rpc('has_role',{_user_id:data.user.id,_role:'admin'});return {admin:role.data===true,email:data.user.email??''};},component:()=> <Outlet/>});
