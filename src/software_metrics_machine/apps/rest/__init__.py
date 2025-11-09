import uvicorn


def main():
    uvicorn.run("software_metrics_machine.apps.rest.main:app")
