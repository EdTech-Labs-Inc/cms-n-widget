/**
 * @repo/agenta
 *
 * Agenta prompt management integration for fetching and using
 * externalized AI prompts.
 *
 * Usage:
 * ```typescript
 * import { agentaClient } from '@repo/agenta';
 *
 * // Fetch a prompt
 * const config = await agentaClient.getPrompt('generate_quiz_questions_prompt');
 *
 * // Interpolate variables
 * const prompt = agentaClient.interpolate(config.userPrompt, {
 *   articleTitle: 'My Article',
 *   articleContent: 'Content here...',
 *   language: 'English',
 * });
 *
 * // Use with OpenAI
 * const result = await openai.chat.completions.create({
 *   model: config.model,
 *   messages: [
 *     { role: 'system', content: config.systemPrompt },
 *     { role: 'user', content: prompt },
 *   ],
 * });
 * ```
 */

export * from './types';
export * from './client';
