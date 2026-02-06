// Centralized logging utility with toggleable debug levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix: string;
}

const isClient = typeof window !== 'undefined';
const forceClientLogs =
  isClient &&
  (process.env.NEXT_PUBLIC_DEBUG_LOGS === '1' || process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true');

const forcedLevel = ((): LogLevel | undefined => {
  const v = process.env.NEXT_PUBLIC_DEBUG_LOG_LEVEL;
  if (v === 'debug' || v === 'info' || v === 'warn' || v === 'error') return v;
  return undefined;
})();

const DEFAULT_CONFIG: LoggerConfig = {
  enabled: forceClientLogs || process.env.NODE_ENV === 'development',
  level: forcedLevel ?? 'debug',
  prefix: '',
};

if (isClient) {
  // One-time bootstrap log. Useful for verifying GitHub Pages builds baked the env vars.
  // This uses console directly so it appears even if logging is disabled.
  // eslint-disable-next-line no-console
  console.info('[Logger]', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_DEBUG_LOGS: process.env.NEXT_PUBLIC_DEBUG_LOGS,
    NEXT_PUBLIC_DEBUG_LOG_LEVEL: process.env.NEXT_PUBLIC_DEBUG_LOG_LEVEL,
    forceClientLogs,
    enabled: DEFAULT_CONFIG.enabled,
    level: DEFAULT_CONFIG.level,
  });
}

class Logger {
  private config: LoggerConfig;

  constructor(prefix: string, config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, prefix, ...config };
  }

  private log(level: LogLevel, ...args: unknown[]) {
    if (!this.config.enabled) return;

    const levelPriority: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    if (levelPriority[level] < levelPriority[this.config.level]) return;

    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);

    switch (level) {
      case 'debug':
        console.log(`${prefix} ${timestamp}`, ...args);
        break;
      case 'info':
        console.info(`${prefix} ${timestamp}`, ...args);
        break;
      case 'warn':
        console.warn(`${prefix} ${timestamp}`, ...args);
        break;
      case 'error':
        console.error(`${prefix} ${timestamp}`, ...args);
        break;
    }
  }

  debug(...args: unknown[]) {
    this.log('debug', ...args);
  }

  info(...args: unknown[]) {
    this.log('info', ...args);
  }

  warn(...args: unknown[]) {
    this.log('warn', ...args);
  }

  error(...args: unknown[]) {
    this.log('error', ...args);
  }

  // Specific logging methods for common patterns
  transition(from: string, to: string, method: 'scroll' | 'click' = 'click') {
    this.debug(`🔄 Transition: ${from} → ${to} (via ${method})`);
  }

  videoState(videoName: string, state: Record<string, unknown>) {
    this.debug(`📹 Video [${videoName}]:`, state);
  }

  loopProgress(current: number, duration: number, speed: number = 1) {
    this.debug(`⏱️  Loop progress: ${current.toFixed(2)}s / ${duration.toFixed(2)}s (${speed}x)`);
  }

  loopComplete(sectionName: string) {
    this.info(`✅ Loop complete: ${sectionName}`);
  }
}

// Create logger instances for different modules
export const createLogger = (prefix: string) => new Logger(prefix);

// Pre-configured loggers
export const homeLogger = createLogger('Home');
export const transitionLogger = createLogger('Transition');
export const videoLogger = createLogger('Video');
