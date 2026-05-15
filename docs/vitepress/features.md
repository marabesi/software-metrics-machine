---
outline: deep
---

# Features

Software Metrics Machine (SMM) offers a variety of features to help you analyze and visualize your software development
data. This section provides an overview of the main features available in SMM.

## Dashboard

To see the dashboard, you first need to start it with the following command:

```bash
smm-dashboard
```

The command will hang the terminal and start a local server on port 5006.

### Accessing the Dashboard

The dashboard, is available under the local url `http://localhost:5006` in your web browser.

![Dashboard Overview](/dashboard/dashboard.png)

The dashboard provides the following features:

- **Data Visualization**: View your data in various formats such as tables, charts, and graphs.
- **Filtering and Sorting**: Easily filter and sort your data to find specific information.
- **Export Options**: Export your data in CSV.

## CLI

For CLI access, you can run various commands to view different metrics. Running the commands are accomplished through
the following command:

```bash
smm
```

Running the above command will show you the available commands you can run. Follow the Explore section below to see the
available commands.

## REST API

Software Metrics Machine also provides a REST API to programmatically access your data and metrics. You can use the API
to integrate SMM with other tools and services. In order to access the REST API, you need to start the SMM server with
the following command:

```bash
smm-rest
```

The API will be available at port 8000, however, a swagger API documentation is available at `http://localhost:8000/docs`.

## Explore

Regardless of the type you choose, the features available are the same. Each feature has its own section in the documentation,
depicting how to use it both in the dashboard and through the CLI.

- [Insights](./features/insights.md)
- [Source Code](./features/code.md)
- [Pull Requests](./features/prs.md)
- [Pipelines](./features/pipelines.md)
- [Configuration](./features/configuration.md)
