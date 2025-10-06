import subprocess


class Run:
    def run_command(
        self, command, check=True, capture_output=False, text=True
    ) -> subprocess.CompletedProcess:
        """
        Wrapper over subprocess.run to execute shell commands.

        Args:
            command (list or str): The command to execute.
            check (bool): If True, raises CalledProcessError on non-zero exit.
            capture_output (bool): If True, captures stdout and stderr.
            text (bool): If True, interprets output as text instead of bytes.

        Returns:
            subprocess.CompletedProcess: The result of the executed command.
        """
        try:
            result = subprocess.run(
                command, check=check, capture_output=capture_output, text=text
            )
            return result
        except subprocess.CalledProcessError as e:
            print(f"Command failed with exit code {e.returncode}: {e.cmd}")
            print(f"Output: {e.output}")
            print(f"Error: {e.stderr}")
            raise
