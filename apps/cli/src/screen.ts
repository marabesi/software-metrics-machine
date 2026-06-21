export class Screen {
  printLine(message = ''): void {
    // Centralized console boundary for CLI user-facing output.
    // eslint-disable-next-line no-console
    console.log(message);
  }
}
