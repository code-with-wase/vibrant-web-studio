import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
      placeholderData: (previous: unknown) => previous,
    },
  },
});
