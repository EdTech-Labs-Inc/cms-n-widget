import { createCaller } from "@repo/widget-api";
import { cache } from "react";

/**
 * Server-side tRPC caller for SSR and Server Components
 * This bypasses HTTP and calls procedures directly - no network roundtrip!
 *
 * Usage in Server Components:
 * ```tsx
 * import { serverTrpc } from "@/lib/trpc-server";
 *
 * export default async function Page() {
 *   const data = await serverTrpc.getLearningHubContent();
 *   return <div>{data.videos.length} videos</div>;
 * }
 * ```
 */
export const serverTrpc = createCaller({});

/**
 * Cached version - use this to deduplicate requests within a single render
 * React will automatically cache calls with the same parameters
 */
// export const cachedServerTrpc = {
//   getLearningHubContent: cache(() => serverTrpc.getLearningHubContent()),
//   getTestSubmission: cache(() => serverTrpc.getTestSubmission()),
//   getArticle: cache((input: { id: string }) => serverTrpc.getArticle(input)),
//   getArticleAudio: cache((input: { articleId: string }) => serverTrpc.getArticleAudio(input)),
//   getVideoWithBubbles: cache((input: { videoOutputId: string }) =>
//     serverTrpc.getVideoWithBubbles(input)
//   ),
// };
