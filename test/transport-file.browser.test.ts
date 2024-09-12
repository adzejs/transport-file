/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, afterEach, describe, expect, test } from 'vitest';
import adze, { setup, teardown } from 'adze';
import TransportFile from '../src';

/**
 * @vitest-environment happy-dom
 */

describe('log filtering', () => {
  afterEach(() => {
    teardown();
  });

  test('does nothing in the browser', async () => {
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

    expect(fn.mock.calls.length).toBe(0);
  });
});
