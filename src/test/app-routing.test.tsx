import { matchRoutes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { router } from "@/router";

describe("Hash-routed app pages", () => {
  it("routes the login page at the root", () => {
    const matches = matchRoutes(router.routes, "/");

    expect(matches?.at(-1)?.route.index).toBe(true);
  });

  it.each([
    "dashboard",
    "products",
    "brands",
    "categories",
    "billing",
    "invoices",
    "low-stock",
    "reports",
    "admins",
  ])("matches the workspace section /%s under the app shell", (section) => {
    const matches = matchRoutes(router.routes, `/${section}`);

    expect(matches?.map((match) => match.route.path)).toEqual(["/", ":section"]);
  });

  it("matches unknown application paths to the not-found page", () => {
    const matches = matchRoutes(router.routes, "/not-a-section");

    expect(matches?.at(-1)?.route.path).toBe(":section");
    expect(matches?.at(-1)?.route.loader).toBeTypeOf("function");
  });
});
