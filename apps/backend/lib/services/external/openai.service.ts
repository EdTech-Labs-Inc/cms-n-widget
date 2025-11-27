/**
 * Re-export openai-client.service for backwards compatibility
 * New code should import directly from openai-client.service
 */
export { openaiClientService, openaiClientService as openaiService, OpenAIClientService } from './openai-client.service';
