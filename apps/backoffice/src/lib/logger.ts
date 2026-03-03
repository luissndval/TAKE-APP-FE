type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const EMOJIS: Record<LogLevel, string> = {
  debug: "🔍",
  info:  "✅",
  warn:  "⚠️ ",
  error: "❌",
};

class Logger {
  private prefix: string;
  private isDev: boolean;

  constructor(prefix: string) {
    this.prefix  = prefix;
    this.isDev   = process.env.NODE_ENV === "development";
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    // En producción sólo warn/error
    if (!this.isDev && (level === "debug" || level === "info")) return;

    const ts  = new Date().toISOString();
    const msg = `${EMOJIS[level]} [${ts}] [${this.prefix}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      console[level](msg, context);
    } else {
      console[level](msg);
    }
  }

  debug(message: string, context?: LogContext) { this.log("debug", message, context); }
  info (message: string, context?: LogContext) { this.log("info",  message, context); }
  warn (message: string, context?: LogContext) { this.log("warn",  message, context); }
  error(message: string, context?: LogContext) { this.log("error", message, context); }
}

export function createLogger(name: string): Logger {
  return new Logger(name);
}
