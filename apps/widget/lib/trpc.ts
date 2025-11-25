import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { WidgetRouter } from "@repo/widget-api";

export function getBaseUrl() {
  if (typeof window !== "undefined") {
    // Browser should use relative path
    return "";
  }
  // SSR should use absolute URL

  return `http://localhost:${process.env.PORT || 3000}`;
}

export const trpc = createTRPCClient<WidgetRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});
