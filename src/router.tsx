import { createHashRouter, redirect, type LoaderFunctionArgs } from "react-router-dom";
import { api as db } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { dashboardQuery, sections, shopQuery } from "@/lib/shop";
import {
  NotFoundPage,
  RootLayout,
  RouteErrorPage,
  WorkspaceRoute,
  type AdminAccess,
} from "@/routes/app-shell";
import { LoginPage } from "@/routes/index";

async function loadWorkspace({ params }: LoaderFunctionArgs): Promise<AdminAccess> {
  if (!sections.some((section) => section === params["section"])) {
    throw new Response("Not Found", { status: 404, statusText: "Not Found" });
  }

  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw redirect("/");

  const admin = data.user.role === "admin";
  if (admin) {
    void queryClient.prefetchQuery(shopQuery);
    void queryClient.prefetchQuery(dashboardQuery);
  }

  return { admin, email: data.user.email ?? "" };
}

export const router = createHashRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LoginPage /> },
      {
        path: ":section",
        loader: loadWorkspace,
        element: <WorkspaceRoute />,
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
