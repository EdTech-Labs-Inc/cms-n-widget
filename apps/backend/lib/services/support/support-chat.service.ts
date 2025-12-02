import { openaiClientService } from '../external/openai-client.service';
import { logger } from '@repo/logging';

// Default system prompt if Agenta is not configured or fails
// This will be replaced with Agenta integration once the prompt is created
const DEFAULT_SYSTEM_PROMPT = `You are a helpful support assistant for a Content Management System (CMS) platform. This platform helps organizations create and manage educational content, including:

**Core Features:**
- **Article Management**: Create, edit, and manage articles with rich content
- **Media Generation**: Automatically generate various media from articles:
  - Audio (text-to-speech)
  - Podcasts (AI-generated discussions)
  - Videos (AI avatar presentations)
  - Quizzes (interactive questions)
  - Interactive Podcasts (audio with embedded questions)
- **Tag Management**: Organize content with tags and categories
- **Multi-language Support**: Content can be generated in English, Hindi, Marathi, Bengali, and Gujarati
- **Approval Workflow**: Content goes through an approval process before publishing

**Key Workflows:**
1. **Creating Content**: Users create articles, which can then be submitted for media generation
2. **Media Generation**: The system processes articles to generate various media types (audio, video, podcast, quiz, interactive podcast)
3. **Review & Approval**: Generated content goes through a review process
4. **Publishing**: Approved content becomes available in the Learning Hub widget

**Common Questions You Can Help With:**
- How to create and manage articles
- Understanding the media generation process
- Troubleshooting submission issues
- Managing tags and organization
- Understanding content statuses and workflows

**Guidelines:**
- Be concise and helpful
- If you don't know something, say so honestly
- For technical issues, suggest contacting support via the feedback form
- Focus on the platform features and workflows

How can I help you today?`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Support Chat Service - Handles AI chat for support widget
 */
class SupportChatService {
  private systemPrompt: string = DEFAULT_SYSTEM_PROMPT;

  /**
   * Get the system prompt (from Agenta or default)
   * TODO: Integrate with Agenta once prompt is created
   */
  async getSystemPrompt(): Promise<string> {
    // TODO: Fetch from Agenta when `support_chat_agent` prompt is created
    // try {
    //   const config = await agentaClient.getPrompt('support_chat_agent');
    //   this.systemPrompt = config.systemPrompt;
    // } catch (error) {
    //   logger.warn('[SupportChat] Failed to fetch prompt from Agenta, using default', {
    //     error: error instanceof Error ? error.message : 'Unknown error',
    //   });
    // }
    return this.systemPrompt;
  }

  /**
   * Stream a chat response
   * Returns an async generator that yields content chunks
   */
  async *streamChat(
    messages: ChatMessage[],
    sessionId: string
  ): AsyncGenerator<string, void, unknown> {
    logger.info('[SupportChat] Starting chat stream', {
      sessionId,
      messageCount: messages.length,
    });

    const systemPrompt = await this.getSystemPrompt();

    // Build the full message array with system prompt
    const fullMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    try {
      for await (const chunk of openaiClientService.streamChat({
        messages: fullMessages,
        temperature: 0.7,
        maxTokens: 1000,
      })) {
        yield chunk;
      }

      logger.info('[SupportChat] Chat stream completed', { sessionId });
    } catch (error) {
      logger.error('[SupportChat] Chat stream failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export const supportChatService = new SupportChatService();
