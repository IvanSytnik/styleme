/**
 * Process-level safety net.
 *
 * Node's default for an unhandled rejection is to exit with code 1, which
 * would also drop every in-flight, already-billed generation. This is defense
 * in depth only: request-path rejections must still be forwarded to next(err).
 *
 * The rejected work is not recovered, and the request that started it may
 * hang until the client gives up. Every log line from this handler is a bug.
 *
 * Takes its logger as an argument and imports nothing, so it can be exercised
 * without loading env.ts.
 */

export interface ProcessGuardLogger {
  error(obj: { err: unknown }, msg: string): void;
}

export function createUnhandledRejectionHandler(log: ProcessGuardLogger): (reason: unknown) => void {
  return (reason) => {
    log.error({ err: reason }, '[process] unhandled promise rejection');
  };
}

export function installProcessGuards(log: ProcessGuardLogger): void {
  process.on('unhandledRejection', createUnhandledRejectionHandler(log));
}
