/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, afterEach, describe, expect, test } from 'vitest';
import adze, { setup, teardown } from 'adze';
import TransportFile from '../src';

/**
 * @vitest-environment node
 */

describe('log filtering', () => {
  afterEach(() => {
    teardown();
  });

  test('writes a log to a file', async () => {
    console.info = vi.fn();

    const fileTransport = new TransportFile({ directory: './temp/logs' });
    await fileTransport.load();

    const fn = vi.fn();
    vi.spyOn(fileTransport as any, 'writeLog').mockImplementation(fn);

    setup({
      format: 'standard',
      timestampFormatter: () => 'testdate',
      middleware: [fileTransport],
    });

    adze.info('This is a test log message.');

    const line = fn.mock.calls[0][0].message.join('').trim();
    expect(line).toBe('[testdate] INFO: This is a test log message.');
  });
});
