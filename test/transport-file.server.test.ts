/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import adze, { setup, teardown } from 'adze';
import * as jetpack from 'fs-jetpack';
import { afterEach, describe, expect, test, vi } from 'vitest';
import TransportFile from '../src';

/**
 * @vitest-environment node
 */

describe('log filtering', () => {
  afterEach(() => {
    teardown();
  });

  // afterAll(() => {
  //   jetpack.remove('./temp/logs');
  // });

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

    const line = fn.mock.calls[0][0].trim();
    expect(line).toBe('[testdate] INFO: This is a test log message.');
  });

  test('writes a clean pretty log to a file', async () => {
    console.info = vi.fn();

    const fileTransport = new TransportFile({ directory: './temp/logs' });
    await fileTransport.load();

    const fn = vi.fn();
    vi.spyOn(fileTransport as any, 'writeLog').mockImplementation(fn);

    setup({
      format: 'pretty',
      withEmoji: true,
      timestampFormatter: () => 'testdate',
      middleware: [fileTransport],
    });

    adze.info('This is a test log message.');
    const line = fn.mock.calls[0][0].trim();
    expect(line).toBe('ℹ️ Info      This is a test log message.');
  });

  test('the audit log file location is the same as the directory option', async () => {
    jetpack.dir('./temp/logs');

    const fileTransport = new TransportFile({
      directory: './temp/logs',
      end_stream: true,
      onClose: () => {
        jetpack.remove('./temp');
      },
    });
    await fileTransport.load();

    setup({
      format: 'standard',
      timestampFormatter: () => 'testdate',
      middleware: [fileTransport],
    });

    adze.info('This is a test log message.');

    await vi.waitFor(() => {
      const audit = jetpack.read('./temp/logs/audit.json', 'json');
      fileTransport.end();
      expect(audit.files.length).toBe(1);
    });
  });
});
