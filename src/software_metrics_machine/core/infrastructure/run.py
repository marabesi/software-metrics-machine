import subprocess


class Run:
    def run_command(
        self, command, check=True, capture_output=False, text=True
    ) -> subprocess.CompletedProcess:
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
