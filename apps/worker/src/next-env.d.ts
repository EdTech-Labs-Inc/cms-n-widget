/**
 * Type declarations for @next/env
 * Required because the worker compiles backend lib files that use @next/env
 */
declare module '@next/env' {
  export function loadEnvConfig(
    dir: string,
    dev?: boolean,
    log?: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void }
  ): {
    combinedEnv: NodeJS.ProcessEnv;
    loadedEnvFiles: string[];
  };
}
