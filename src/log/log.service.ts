import { ConsoleLogger, Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
}

@Injectable()
export class LogService extends ConsoleLogger {
  private static logSubject = new Subject<LogEntry>();
  private static history: LogEntry[] = [];
  private static readonly MAX_HISTORY_SIZE = 200;

  static get log$() {
    return this.logSubject.asObservable();
  }

  static getHistory(): LogEntry[] {
    return [...this.history];
  }

  log(message: any, ...optionalParams: any[]) {
    super.log(message, ...optionalParams);
    this.broadcast('log', message, optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    super.error(message, ...optionalParams);
    this.broadcast('error', message, optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    super.warn(message, ...optionalParams);
    this.broadcast('warn', message, optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    super.debug(message, ...optionalParams);
    this.broadcast('debug', message, optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    super.verbose(message, ...optionalParams);
    this.broadcast('verbose', message, optionalParams);
  }

  private broadcast(level: string, message: any, optionalParams: any[]) {
    let formattedMessage = '';
    if (message instanceof Error) {
      formattedMessage = message.stack || message.message;
    } else if (typeof message === 'object') {
      try {
        formattedMessage = JSON.stringify(message);
      } catch {
        formattedMessage = String(message);
      }
    } else {
      formattedMessage = String(message);
    }

    let context = '';
    if (optionalParams && optionalParams.length > 0) {
      const lastParam = optionalParams[optionalParams.length - 1];
      if (typeof lastParam === 'string') {
        context = lastParam;
      }
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: formattedMessage,
      context,
    };

    // Add to history
    LogService.history.push(entry);
    if (LogService.history.length > LogService.MAX_HISTORY_SIZE) {
      LogService.history.shift();
    }

    // Emit live log
    LogService.logSubject.next(entry);
  }
}
