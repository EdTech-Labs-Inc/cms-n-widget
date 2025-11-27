import type {
  AgentaClientConfig,
  AgentaPromptConfig,
  AgentaFetchResponse,
  CachedPrompt,
} from './types';

/**
 * Agenta Client
 *
 * Fetches prompt configurations from Agenta with caching and retry logic.
 *
 * Features:
 * - 15-minute cache TTL to reduce API calls
 * - 3 retries with exponential backoff (1s, 2s, 4s)
 * - Environment-aware (production/staging/development)
 * - Variable interpolation helper
 */
export class AgentaClient {
  private apiKey: string;
  private baseUrl: string;
  private environment: string;
  private cacheTTL: number;
  private maxRetries: number;
  private cache: Map<string, CachedPrompt>;

  constructor(config: AgentaClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://cloud.agenta.ai';
    this.environment = config.environment || 'production';
    this.cacheTTL = config.cacheTTL || 900000; // 15 minutes
    this.maxRetries = config.maxRetries || 3;
    this.cache = new Map();
  }

  /**
   * Fetch a prompt configuration from Agenta
   *
   * @param slug - The Agenta application slug (e.g., "generate_quiz_questions_prompt")
   * @returns The processed prompt configuration
   * @throws Error if all retries fail
   */
  async getPrompt(slug: string): Promise<AgentaPromptConfig> {
    // Check cache first
    const cached = this.cache.get(slug);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.config;
    }

    // Fetch from Agenta with retries
    const response = await this.fetchWithRetry(slug);
    const config = this.parseResponse(response);

    // Cache the result
    this.cache.set(slug, {
      config,
      timestamp: Date.now(),
    });

    return config;
  }

  /**
   * Interpolate variables in a template string
   *
   * @param template - The template string with {{variable}} placeholders
   * @param variables - Key-value pairs to substitute
   * @returns The interpolated string
   */
  interpolate(template: string, variables: Record<string, string>): string {
    if (!template) {
      return '';
    }
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      // Replace all occurrences of {{key}} with value
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(pattern, value);
    }
    return result;
  }

  /**
   * Clear the prompt cache
   * Useful for testing or forcing a refresh
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear a specific prompt from cache
   */
  clearPromptCache(slug: string): void {
    this.cache.delete(slug);
  }

  /**
   * Fetch from Agenta API with exponential backoff retry
   */
  private async fetchWithRetry(slug: string): Promise<AgentaFetchResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/api/variants/configs/fetch`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            environment_ref: {
              slug: this.environment,
              id: null,
            },
            application_ref: {
              slug: slug,
              id: null,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Agenta API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // Validate response structure
        if (!data?.params?.prompt) {
          console.error('[Agenta] Invalid response structure for', slug, ':', JSON.stringify(data, null, 2));
          throw new Error(
            `Agenta returned invalid response structure - missing params.prompt. Response keys: ${Object.keys(data || {}).join(', ')}`
          );
        }

        return data as AgentaFetchResponse;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't wait after the last attempt
        if (attempt < this.maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Failed to fetch prompt "${slug}" from Agenta after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Parse the Agenta API response into a usable format
   */
  private parseResponse(response: AgentaFetchResponse): AgentaPromptConfig {
    const { params } = response;

    if (!params) {
      throw new Error('Agenta response missing params object');
    }

    const { prompt } = params;

    if (!prompt) {
      throw new Error('Agenta response missing prompt configuration');
    }

    // Try dedicated fields first, fall back to messages array
    let systemPrompt = prompt.system_prompt;
    let userPrompt = prompt.user_prompt;

    if ((systemPrompt === undefined || userPrompt === undefined) && prompt.messages?.length > 0) {
      for (const msg of prompt.messages) {
        if (msg.role === 'system' && systemPrompt === undefined) {
          systemPrompt = msg.content;
        } else if (msg.role === 'user' && userPrompt === undefined) {
          userPrompt = msg.content;
        }
      }
    }

    if (!userPrompt) {
      throw new Error(
        `Agenta prompt missing user_prompt. ` +
        `Available fields: user_prompt=${!!prompt.user_prompt}, system_prompt=${!!prompt.system_prompt}, messages=${prompt.messages?.length ?? 0}`
      );
    }

    return {
      systemPrompt: systemPrompt ?? '',
      userPrompt,
      inputKeys: prompt.input_keys ?? [],
      model: prompt.llm_config?.model ?? 'gpt-4o',
    };
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a singleton instance with environment variables
 * This will be initialized when the module is imported
 */
let _agentaClient: AgentaClient | null = null;

/**
 * Get or create the Agenta client singleton
 *
 * @param config - Optional config to override environment variables
 */
export function getAgentaClient(config?: Partial<AgentaClientConfig>): AgentaClient {
  if (!_agentaClient || config) {
    _agentaClient = new AgentaClient({
      apiKey: config?.apiKey || process.env.AGENTA_API_KEY || '',
      baseUrl: config?.baseUrl || process.env.AGENTA_BASE_URL || 'https://cloud.agenta.ai',
      environment: config?.environment || process.env.AGENTA_ENVIRONMENT || 'production',
      cacheTTL: config?.cacheTTL || parseInt(process.env.AGENTA_CACHE_TTL || '900000', 10),
      maxRetries: config?.maxRetries || 3,
    });
  }
  return _agentaClient;
}

/**
 * Default client instance using environment variables
 */
export const agentaClient = {
  /**
   * Fetch a prompt configuration from Agenta
   */
  getPrompt: (slug: string) => getAgentaClient().getPrompt(slug),

  /**
   * Interpolate variables in a template string
   */
  interpolate: (template: string, variables: Record<string, string>) =>
    getAgentaClient().interpolate(template, variables),

  /**
   * Clear the prompt cache
   */
  clearCache: () => getAgentaClient().clearCache(),

  /**
   * Clear a specific prompt from cache
   */
  clearPromptCache: (slug: string) => getAgentaClient().clearPromptCache(slug),
};
