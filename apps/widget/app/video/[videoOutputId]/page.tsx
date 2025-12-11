import { serverTrpc } from "@/lib/trpc-server";
import VideoPlayerWrapper from "@/components/video/VideoPlayerWrapper";

interface VideoPageProps {
  params: Promise<{
    videoOutputId: string;
  }>;
}

export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: VideoPageProps) {
  const { videoOutputId } = await params;

  const videoData = await serverTrpc.getVideoWithBubbles({
    videoOutputId,
  });

  // Convert null to undefined and transform bubbles to match Video type
  const video = {
    ...videoData,
    heygenVideoId: videoData.heygenVideoId ?? undefined,
    duration: videoData.duration ?? undefined,
    transcript: videoData.transcript ?? undefined,
    bubbles: videoData.bubbles.map((bubble) => ({
      ...bubble,
      options: Array.isArray(bubble.options) ? bubble.options as string[] : [],
      correctAnswer: typeof bubble.correctAnswer === 'number' ? bubble.correctAnswer : 0,
    })),
  };

  return <VideoPlayerWrapper video={video} />;
}
