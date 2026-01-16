import chalk from 'chalk';

const time = () =>
  chalk.gray.dim(new Date().toLocaleTimeString());

const symbol = {
  info: chalk.cyan('>>'),
  success: chalk.green('✔'),
  warn: chalk.yellow('▲'),
  error: chalk.red('✖')
};

function formatContext(context?: string) {
  if (!context) return '';
  return chalk.magenta.dim(context) + ' ';
}

function normalizeContext(input: any): string {
  if (typeof input === 'string') return input;
  if (typeof input === 'function') return input.name;
  if (typeof input === 'object' && input?.constructor)
    return input.constructor.name;
  return 'unknown';
}

export const logger = {
  withContext(context: any) {
    const ctx = normalizeContext(context);

    return {
      info(message: string) {
        console.log(
          `${time()} ${formatContext(ctx)}${symbol.info} ${chalk.white(message)}`
        );
      },
      success(message: string) {
        console.log(
          `${time()} ${formatContext(ctx)}${symbol.success} ${chalk.green(message)}`
        );
      },
      warn(message: string) {
        console.warn(
          `${time()} ${formatContext(ctx)}${symbol.warn} ${chalk.yellow(message)}`
        );
      },
      error(message: string) {
        console.error(
          `${time()} ${formatContext(ctx)}${symbol.error} ${chalk.red(message)}`
        );
      }
    };
  },

  info(message: string) {
    console.log(
      `${time()} ${symbol.info} ${chalk.white(message)}`
    );
  },

  success(message: string) {
    console.log(
      `${time()} ${symbol.success} ${chalk.green(message)}`
    );
  },

  warn(message: string) {
    console.warn(
      `${time()} ${symbol.warn} ${chalk.yellow(message)}`
    );
  },

  error(message: string) {
    console.error(
      `${time()} ${symbol.error} ${chalk.red(message)}`
    );
  }
};
