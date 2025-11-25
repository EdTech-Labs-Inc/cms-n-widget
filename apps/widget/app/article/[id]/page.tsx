import { serverTrpc } from "../../../lib/trpc-server";
import ArticleDisplay from "@/components/article/ArticleDisplay";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;

  // Fetch article, audio, and quiz on the server using vanilla tRPC client
  const [article, audioData, quizData] = await Promise.all([
    serverTrpc.getArticle({ id }),
    serverTrpc.getArticleAudio({ articleId: id }),
    serverTrpc.getArticleQuiz({ articleId: id }),
  ]);

  return <ArticleDisplay article={article} audioData={audioData} quizData={quizData} />;
}
