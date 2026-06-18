import { Command } from 'commander';
import type { CommandOptions } from 'commander';

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
  override createCommand(name?: string): SmmCommand {
    return new SmmCommand(name);
  }

  subcommand(nameAndArgs: string): SmmCommand {
    return this.command(nameAndArgs) as SmmCommand;
  }

  actionWithSmm(
    handler: (options: CommandOptions, command: SmmCommand) => void | Promise<void>
  ): this {
    return this.action((options: unknown, command: Command) => {
      return handler(options as CommandOptions, command as unknown as SmmCommand);
    });
  }

  getGlobalOptions(): GlobalCliOptions {
    return this.optsWithGlobals() as GlobalCliOptions;
  }

  getSelectedProject(): string | undefined {
    return this.getGlobalOptions().project;
  }
}
