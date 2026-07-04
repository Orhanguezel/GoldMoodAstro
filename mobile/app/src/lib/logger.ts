type LogArgs = readonly unknown[];

const devConsole = globalThis.console;

export const logger = {
  debug: (...args: LogArgs) => {
    if (__DEV__) devConsole.debug(...args);
  },
  info: (...args: LogArgs) => {
    if (__DEV__) devConsole.info(...args);
  },
  warn: (...args: LogArgs) => {
    if (__DEV__) devConsole.warn(...args);
  },
  error: (...args: LogArgs) => {
    if (__DEV__) devConsole.error(...args);
  },
};
