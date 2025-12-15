import adze, { Middleware } from 'adze';
import type FileStreamRotator from 'file-stream-rotator/lib/FileStreamRotator';
import type { FileStreamRotatorOptions } from 'file-stream-rotator/src/types';

/**
 * Options for the AdzeFileRotator middleware.
 */
export interface AdzeTransportFileOptions extends Partial<FileStreamRotatorOptions> {
  /**
   * Shortcut property for defining the target log directory and audit file directory.
   */
  directory?: string;
  /**
   * Callback for hooking into the open event.
   */
  onOpen?: () => void;
  /**
   * Callback for hooking into the close event.
   */
  onClose?: () => void;
  /**
   * Callback for hooking into the error event.
   */
  onError?: (err: Error) => void;
  /**
   * Callback for hooking into the finish event.
   */
  onFinish?: () => void;
  /**
   * Callback for hooking into the rotate event when a log file is rotated.
   */
  onRotate?: () => void;
  /**
   * Callback for hooking into the new file event when a new log file is created.
   */
  onNew?: (newFile: string) => void;
  /**
   * Callback for hooking into the log removed event when a log file is removed.
   */
  onLogRemoved?: (date: number, name: string, hash: string) => void;
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
   * The path to the audit file used by file-stream-rotator.
   */
  private audit_file?: string;

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
    this.audit_file = directory ? this.directory + '/audit.json' : undefined;
    this.options = { ...defaultOpts, ..._opts };
  }

  protected async loadServerDependencies(): Promise<void> {
    const rotateLib = await import('file-stream-rotator');
    const stripAnsiLib = await import('strip-ansi');
    const filename = this.options.filename ?? `${this.directory}/log-%DATE%`;
    const stream = rotateLib.getStream({
      filename,
      ...this.options,
      audit_file: this.audit_file,
    }) as unknown;
    this.stripAnsi = stripAnsiLib.default;
    this.logStream = stream as FileStreamRotator;
    // Register the event listeners if they are set.
    if (this.options.onOpen) this.logStream.on('open', this.options.onOpen);
    if (this.options.onClose) this.logStream.on('close', this.options.onClose);
    if (this.options.onError) this.logStream.on('error', this.options.onError);
    if (this.options.onFinish) this.logStream.on('finish', this.options.onFinish);
    if (this.options.onRotate) this.logStream.on('rotate', this.options.onRotate);
    if (this.options.onNew) this.logStream.on('new', this.options.onNew);
    if (this.options.onLogRemoved) this.logStream.on('logRemoved', this.options.onLogRemoved);
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

  /**
   * Ends the file stream.
   */
  public end(message = 'File stream closed.'): void {
    this.logStream?.end(message);
  }
}
