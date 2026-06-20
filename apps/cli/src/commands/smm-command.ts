import { Command } from 'commander';
import type { Configuration } from '@smmachine/core/infrastructure/configuration';
import { ConfigurationRepository } from '@smmachine/core/infrastructure/configuration-repository';
import { Logger, type LogLevel } from '@smmachine/utils';

type GlobalCliOptions = {
  debug?: boolean;
  project?: string;
};

/**
 * Shared CLI command base class.
 *
 * It ensures child commands are instances of SmmCommand and exposes
 * utility helpers for global option access.
 */
export class SmmCommand extends Command {
  private configurationRepository?: ConfigurationRepository;

  override createCommand(name?: string): SmmCommand {
    return new SmmCommand(name);
  }

  subcommand(nameAndArgs: string): SmmCommand {
    return this.command(nameAndArgs) as SmmCommand;
  }

  actionWithSmm(handler: (options: any, command: SmmCommand) => void | Promise<void>): this {
    return this.action((options: unknown, command: Command) => {
      const smmCommand = command as unknown as SmmCommand;
      smmCommand.getConfigurationRepository();
      return handler(options, smmCommand);
    });
  }

  getGlobalOptions(): GlobalCliOptions {
    return this.optsWithGlobals() as GlobalCliOptions;
  }

  getSelectedProject(): string | undefined {
    return this.getGlobalOptions().project;
  }

  getConfigurationRepository(): ConfigurationRepository {
    if (!this.configurationRepository) {
      this.configurationRepository = new ConfigurationRepository(
        process.env,
        this.getSelectedProject(),
        new Logger('ConfigurationRepository', process.env.DEBUG ? 'DEBUG' : undefined)
      );
    }

    return this.configurationRepository;
  }

  getConfiguration(): Configuration {
    return this.getConfigurationRepository().getActiveConfiguration();
  }

  getLogger(name: string): Logger {
    const configuration = this.getConfiguration();

    return new Logger(name, {
      level: this.resolveLogLevel(configuration),
      filePath: configuration.getLogPath(),
      storeLogs: configuration.storeLogs,
    });
  }

  private resolveLogLevel(configuration: Configuration): LogLevel {
    if (this.getGlobalOptions().debug || process.env.DEBUG) {
      return 'DEBUG';
    }

    return configuration.loggingLevel;
  }
}
