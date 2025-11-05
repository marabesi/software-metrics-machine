"""REST API package for the app - exposes routers that wrap CLI commands.

This package contains a simple router that maps CLI modules under
`apps.cli` to HTTP endpoints. Each endpoint delegates to the underlying
command logic when possible and returns JSON.
"""

__all__ = ["router"]
