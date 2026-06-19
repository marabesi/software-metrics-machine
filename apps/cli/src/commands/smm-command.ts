import { Command } from 'commander';
import type { Configuration } from '@smmachine/core/infrastructure/configuration';
import { ConfigurationRepository } from '@smmachine/core/infrastructure/configuration-repository';

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
        this.getSelectedProject()
      );
    }

    return this.configurationRepository;
  }

  getConfiguration(): Configuration {
    return this.getConfigurationRepository().getActiveConfiguration();
  }
}
