import { Suspense, useEffect } from "react";
import {
  Link,
  Outlet,
  useLoaderData,
  useNavigate,
  useParams,
  useRevalidator,
  isRouteErrorResponse,
  useRouteError,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api as db } from "@/lib/api";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { sections, titles } from "@/lib/shop";
import { ShopWorkspace } from "@/components/shop/workspace";

export type AdminAccess = { admin: boolean; email: string };

export function RootLayout() {
  const navigate = useNavigate();
  const client = useQueryClient();

  useEffect(() => {
    const { data } = db.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_OUT") return;
      void client.cancelQueries();
      client.clear();
      void navigate("/", { replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [client, navigate]);

  return <Outlet />;
}

export function WorkspaceRoute() {
  const { section = "" } = useParams();
  const access = useLoaderData() as AdminAccess;

  useEffect(() => {
    document.title = `${titles[section] ?? "Store"} | Deluxe Culture`;
  }, [section]);

  if (!sections.some((item) => item === section)) return <NotFoundPage />;
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <ShopWorkspace section={section} admin={access.admin} email={access.email} />
    </Suspense>
  );
}

function WorkspaceLoading() {
  return (
    <div className="workspace" role="status" aria-label="Loading store">
      <aside className="sidebar">
        <div className="loading-skeleton loading-brand" />
        <div className="loading-skeleton loading-nav" />
        <div className="loading-skeleton loading-nav" />
        <div className="loading-skeleton loading-nav" />
      </aside>
      <main className="page-main workspace-loading">
        <div className="loading-skeleton loading-title" />
        <div className="loading-skeleton loading-card" />
        <div className="loading-skeleton loading-card loading-card-wide" />
      </main>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export function RouteErrorPage() {
  const error = useRouteError();
  const revalidator = useRevalidator();

  useEffect(() => {
    if (isRouteErrorResponse(error) && error.status === 404) return;
    console.error(error);
    reportLovableError(error, { boundary: "react_router_error_element" });
  }, [error]);

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => revalidator.revalidate()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
