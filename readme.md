# @adze/transport-file

`@adze/transport-file` is a middleware plugin for [AdzeJS](https://adzejs.com) writing logs to
automatically rotating log files.

This library is built on top of [file-stream-rotator](https://github.com/rogerc/file-stream-rotator#readme)
and exposes most of its configuration directly with some minor differences.

## Installation

```bash
# npm
npm i -S @adze/transport-file

#pnpm
pnpm add @adze/transport-file
```

## Project Requirements

This plugin has a peer dependency on `adze`.

| Runtime    | Version      |
| ---------- | ------------ |
| node       | `>= 18.19.x` |
| bun        | `>= 1.1.26`  |
| deno       | `>= 1.46.3`  |
| typescript | `>= 5.5.2`   |

## Usage

```typescript
import adze, { setup } from 'adze';
import TransportFile from '@adze/transport-file';

const fileTransport = new TransportFile({ directory: './logs' });
await fileTransport.load();

setup({
  // ...your other options
  middleware: [fileTransport],
});
```

## Configuration

`@adze/transport-file` exposes all of the configuration options of [file-stream-rotator](https://github.com/rogerc/file-stream-rotator?tab=readme-ov-file#options) directly, with an additional `directory` option.

If the **`directory`** option is declared, then `@adze/transport-file` will use it with a default log
filename pattern. If the **`filename`** option is declared, then **it will take precedence** over the
`directory` option. Setting directory will also simultaneously set the location of the `audit.json`
file to be the same as the rotating log files.

To configure event callbacks, you may also provide the callback functions in the configuration.

Refer to this interface below for all additional options provided by this plugin.

```typescript
interface AdzeTransportFileOptions extends Partial<FileStreamRotatorOptions> {
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
```

For a guide on the options, please visit the readme of **file-stream-rotator**: [**Options**](https://github.com/rogerc/file-stream-rotator?tab=readme-ov-file#options).
