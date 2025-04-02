export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(level: LogLevel, service: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      data
    };
  }

  info(service: string, message: string, data?: any) {
    const log = this.formatLog(LogLevel.INFO, service, message, data);
    this.logs.push(log);
    console.log(`[${log.timestamp}] ${log.level} [${service}]: ${message}`, data || '');
  }

  warn(service: string, message: string, data?: any) {
    const log = this.formatLog(LogLevel.WARN, service, message, data);
    this.logs.push(log);
    console.warn(`[${log.timestamp}] ${log.level} [${service}]: ${message}`, data || '');
  }

  error(service: string, message: string, data?: any) {
    const log = this.formatLog(LogLevel.ERROR, service, message, data);
    this.logs.push(log);
    console.error(`[${log.timestamp}] ${log.level} [${service}]: ${message}`, data || '');
  }

  debug(service: string, message: string, data?: any) {
    const log = this.formatLog(LogLevel.DEBUG, service, message, data);
    this.logs.push(log);
    console.debug(`[${log.timestamp}] ${log.level} [${service}]: ${message}`, data || '');
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance(); 