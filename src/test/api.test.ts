import { afterEach, describe, expect, it, vi } from "vitest";
import { API_URL, api } from "@/lib/api";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("hosted API authentication", () => {
  it("uses the hosted login and admin endpoints with the session token", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push({ url: String(input), init: init ?? {} });
        const data =
          String(input) === `${API_URL}/auth/login`
            ? {
                token: "test-session-token",
                user: { id: "user-1", email: "admin@example.com", role: "admin" },
              }
            : [];
        return new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    const signIn = await api.auth.signInWithPassword({
      email: "admin@example.com",
      password: "test-password",
    });
    expect(signIn.error).toBeNull();
    const session = await api.auth.getUser();
    expect(session.data.user).toMatchObject({ email: "admin@example.com", role: "admin" });
    await api.admins();

    expect(requests.map(({ url }) => url)).toEqual([
      `${API_URL}/auth/login`,
      `${API_URL}/admin/all`,
    ]);
    expect(new Headers(requests[0]?.init.headers).get("Authorization")).toBeNull();
    expect(new Headers(requests[1]?.init.headers).get("Authorization")).toBe(
      "Bearer test-session-token",
    );
  });

  it("deduplicates concurrent hosted session checks", async () => {
    localStorage.setItem("dc-token", "session-token");
    const fetchMock = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return new Response(
        JSON.stringify({
          data: { id: "user-2", email: "user@example.com", role: "admin" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([api.auth.getUser(), api.auth.getUser()]);

    expect(first.data.user?.id).toBe("user-2");
    expect(second.data.user?.id).toBe("user-2");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
