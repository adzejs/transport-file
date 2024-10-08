import adze, { Middleware } from 'adze';
import type FileStreamRotator from 'file-stream-rotator/lib/FileStreamRotator';
import type { FileStreamRotatorOptions } from 'file-stream-rotator/src/types';

/**
 * Options for the AdzeFileRotator middleware.
 */
export interface AdzeTransportFileOptions extends Partial<FileStreamRotatorOptions> {
  directory?: string;
}

/**
 * Default options for the AdzeFileRotator middleware.
 */
const defaultOpts: AdzeTransportFileOptions = {
  directory: './logs',
  frequency: 'daily',
  date_format: 'YYYY-MM-DD',
  size: '1M',
  max_logs: '10d',
  audit_file: './logs/audit.json',
  extension: '.log',
  create_symlink: false,
  symlink_name: 'current.log',
  audit_hash_type: 'md5',
};

/**
 * Wraps the file-stream-rotator package to provide middleware for writing rotating log files.
 */
export class AdzeTransportFile extends Middleware {
  /**
   * The directory path where log files will be written.
   */
  private directory = './logs';

  /**
   * Options for the file stream.
   */
  private options: AdzeTransportFileOptions;

  /**
   * The file stream rotator instance.
   */
  private logStream?: FileStreamRotator;

  /**
   * Dependency for stripping ANSI characters from log messages.
   */
  private stripAnsi?: typeof import('strip-ansi').default;

  constructor(options: AdzeTransportFileOptions = {}) {
    super('server');
    const { directory, ..._opts } = options;
    this.directory = directory ?? this.directory;
    this.options = { ...defaultOpts, ..._opts };
  }

  protected async loadServerDependencies(): Promise<void> {
    const rotateLib = await import('file-stream-rotator');
    const stripAnsiLib = await import('strip-ansi');
    const filename = this.options.filename ?? `${this.directory}/log-%DATE%`;
    const stream = rotateLib.getStream({
      filename,
      ...this.options,
    }) as unknown;
    this.stripAnsi = stripAnsiLib.default;
    this.logStream = stream as FileStreamRotator;
  }

  /**
   * Target the afterTerminated hook to write terminated logs to the file stream.
   */
  public afterTerminated({ data }: adze) {
    if (this.environment === 'server') {
      if (data && data.message.length > 0) {
        this.writeLog(this.cleanAnsi(data.message));
      }
    }
  }

  /**
   * Write a log to the log file stream.
   */
  private writeLog(message: string): void {
    if (this.logStream) {
      this.logStream.write(message + '\n');
    }
  }

  /**
   * Cleans the message of any ANSI characters.
   */
  private cleanAnsi(message: unknown[]): string {
    if (this.stripAnsi) {
      return this.stripAnsi(message.join(''));
    }
    return message.join('');
  }
}
