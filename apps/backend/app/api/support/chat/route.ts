import { NextRequest } from 'next/server';
import { supportChatService } from '@/lib/services/support/support-chat.service';
import { z } from 'zod';

// Validation schema
const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(10000),
    })
  ).min(1).max(50), // Max 50 messages per session
  sessionId: z.string().uuid(),
});

/**
 * POST /api/support/chat
 * Streaming chat endpoint using Server-Sent Events
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate body
    const body = await request.json();
    const validation = chatSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, sessionId } = validation.data;

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of supportChatService.streamChat(messages, sessionId)) {
            // Send each chunk as SSE data
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          // Send done event
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          // Send error event
          const errorMessage = error instanceof Error ? error.message : 'An error occurred';
          const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[API] Error in chat endpoint:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
