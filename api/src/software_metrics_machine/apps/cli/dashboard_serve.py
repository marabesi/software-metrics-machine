import click
import subprocess
import signal
import sys
import os
import time
import atexit
from pathlib import Path
import webbrowser

# Global variables to track subprocess
api_process = None
frontend_process = None


def cleanup_processes():
    """Cleanup function to kill both processes on exit"""
    for proc in [api_process, frontend_process]:
        if proc and proc.poll() is None:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except (subprocess.TimeoutExpired, Exception):
                proc.kill()


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    click.echo("\n\nShutting down services...")
    cleanup_processes()
    sys.exit(0)


@click.command(name="serve")
@click.option(
    "--api-port",
    type=int,
    default=8000,
    help="Port for the API server (default: 8000)"
)
@click.option(
    "--frontend-port",
    type=int,
    default=3000,
    help="Port for the frontend server (default: 3000)"
)
@click.option(
    "--hostname",
    type=str,
    default="localhost",
    help="Hostname/IP to bind to (default: localhost)"
)
@click.option(
    "--open/--no-open",
    default=True,
    help="Open browser after servers start (default: True)"
)
@click.option(
    "--verbose",
    is_flag=True,
    help="Show verbose output from servers"
)
def command(api_port, frontend_port, hostname, open, verbose):
    """Start the Software Metrics Machine dashboard with API and frontend servers."""

    global api_process, frontend_process

    # Register cleanup handlers
    atexit.register(cleanup_processes)
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        subprocess.run(["node", "--version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        click.echo(
            click.style(
                "Error: Node.js is required but not found. "
                "Please install Node.js from https://nodejs.org/",
                fg="red"
            )
        )
        sys.exit(1)

    # Find the frontend build directory
    # When running from development: api/src/software_metrics_machine/apps/cli/dashboard_serve.py
    # We need to go back to the project root to find webapp
    package_dir = Path(__file__).parent.parent.parent  # software_metrics_machine

    # Try different possible locations for the webapp
    possible_locations = [
        package_dir.parent.parent.parent / "api/out",
    ]

    webapp_dir = None
    for location in possible_locations:
        if location.exists():
            webapp_dir = location
            break

    if webapp_dir is None:
        click.echo(
            click.style(
                "Error: Frontend build directory not found.\n"
                "Searched locations:\n" +
                "\n".join(f"  - {loc}" for loc in possible_locations),
                fg="red"
            )
        )
        sys.exit(1)

    frontend_build_dir = webapp_dir
    if not frontend_build_dir.exists():
        click.echo(
            click.style(
                f"Error: Frontend build not found at {frontend_build_dir}\n",
                fg="red"
            )
        )
        sys.exit(1)

    click.echo(click.style("Starting Software Metrics Machine Dashboard...", fg="cyan", bold=True))
    click.echo(f"API Server: http://{hostname}:{api_port}")
    click.echo(f"Frontend: http://{hostname}:{frontend_port}")
    click.echo("")

    try:
        # Start API server
        click.echo(click.style("Starting API server...", fg="yellow"))
        api_env = os.environ.copy()
        api_env["PORT"] = str(api_port)
        api_cmd = [
            sys.executable,
            "-m",
            "uvicorn",
            "software_metrics_machine.apps.rest.main:app",
            "--host",
            hostname,
            "--port",
            str(api_port)
        ]
        api_process = subprocess.Popen(
            api_cmd,
            env=api_env,
            stdout=subprocess.PIPE if not verbose else None,
            stderr=subprocess.PIPE if not verbose else None,
            text=True
        )
        click.echo(click.style(f"✓ API server started (PID: {api_process.pid})", fg="green"))

        time.sleep(2)

        # Start frontend server
        click.echo(click.style("Starting frontend server...", fg="yellow"))
        frontend_env = os.environ.copy()
        frontend_env["PORT"] = str(frontend_port)
        frontend_env["NEXT_PUBLIC_API_URL"] = f"http://{hostname}:{api_port}"

        frontend_cmd = ["npm", "run", "start"]
        frontend_process = subprocess.Popen(
            frontend_cmd,
            cwd=str(webapp_dir),
            env=frontend_env,
            stdout=subprocess.PIPE if not verbose else None,
            stderr=subprocess.PIPE if not verbose else None,
            text=True
        )
        click.echo(click.style(f"✓ Frontend server started (PID: {frontend_process.pid})", fg="green"))

        # Wait a moment for frontend to start
        time.sleep(2)

        # Open browser if requested
        if open:
            webbrowser.open(f"http://{hostname}:{frontend_port}")
            click.echo("")
            click.echo(click.style("✓ Opening browser...", fg="green"))

        click.echo("")
        click.echo(click.style("Dashboard is ready! Press Ctrl+C to stop.", fg="cyan", bold=True))
        click.echo("")

        while True:
            api_status = api_process.poll()
            frontend_status = frontend_process.poll()

            if api_status is not None:
                click.echo(click.style("⚠ API server has stopped", fg="red"))
                raise RuntimeError("API server stopped unexpectedly")

            if frontend_status is not None:
                click.echo(click.style("⚠ Frontend server has stopped", fg="red"))
                raise RuntimeError("Frontend server stopped unexpectedly")

            time.sleep(1)

    except KeyboardInterrupt:
        click.echo("\n\nShutting down services...")
    except Exception as e:
        click.echo(click.style(f"Error: {str(e)}", fg="red"))
        sys.exit(1)
    finally:
        cleanup_processes()
