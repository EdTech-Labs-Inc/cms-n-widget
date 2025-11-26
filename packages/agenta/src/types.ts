/**
 * Agenta API Types
 *
 * Types for interacting with the Agenta prompt management API.
 */

/**
 * Processed prompt configuration ready for use
 */
export interface AgentaPromptConfig {
  /** The system prompt content */
  systemPrompt: string;
  /** The user prompt template (may contain {{variables}}) */
  userPrompt: string;
  /** List of variable names expected in the prompt */
  inputKeys: string[];
  /** The model to use (e.g., "gpt-4o") */
  model: string;
}

/**
 * Raw response from Agenta API /variants/configs/fetch endpoint
 */
export interface AgentaFetchResponse {
  params: {
    prompt: {
      messages: Array<{ role: string; content: string }>;
      input_keys: string[];
      llm_config: {
        model: string;
        tools: unknown[];
        temperature?: number;
        max_tokens?: number;
      };
      user_prompt: string;
      system_prompt: string;
      template_format: string;
    };
  };
  url: string;
  application_ref: {
    slug: string;
    version: number | null;
    id: string;
  };
  variant_ref: {
    slug: string;
    version: number;
    id: string;
  };
  environment_ref: {
    slug: string;
    version: number;
    id: string;
  };
}

/**
 * Configuration options for the Agenta client
 */
export interface AgentaClientConfig {
  /** Agenta API key */
  apiKey: string;
  /** Base URL for Agenta API (default: https://cloud.agenta.ai) */
  baseUrl?: string;
  /** Environment slug (default: production) */
  environment?: string;
  /** Cache TTL in milliseconds (default: 900000 = 15 minutes) */
  cacheTTL?: number;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
}

/**
 * Cached prompt entry
 */
export interface CachedPrompt {
  config: AgentaPromptConfig;
  timestamp: number;
}
