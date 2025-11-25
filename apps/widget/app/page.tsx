import { serverTrpc } from '../lib/trpc-server';
import { TRPCProvider } from '../lib/trpc-react';
import LearningHubClient from '@/components/learning-hub/LearningHubClient';

// Server component with SSR data fetching
export const revalidate = 300; // Revalidate every 5 minutes

export const dynamic = 'force-dynamic';

export default async function LearningHub() {
  // Fetch all content on the server using direct tRPC caller (no HTTP roundtrip!)
  const content = await serverTrpc.getLearningHubContent();
  console.log('[LearningHub] getLearningHubContent result:', {
    videos: content?.videos?.length,
    podcasts: content?.podcasts?.length,
    interactivePodcasts: content?.interactivePodcasts?.length,
    articles: content?.articles?.length,
    fetchTime: content?.fetchTime,
  });

  return (
    <TRPCProvider>
      <LearningHubClient initialContent={content} />
    </TRPCProvider>
  );
}
