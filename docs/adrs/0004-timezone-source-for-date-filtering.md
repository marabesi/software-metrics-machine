# ADR 0004: Timezone Source for Date Filtering and Grouping

Date: 2026-06-25

Status: Accepted

## Context

Software Metrics Machine supports both CLI and REST/dashboard access paths. Both paths filter and group timestamped
data from providers such as GitHub, Jira, Git logs, and cached metric files.

The project already has a `TimeZoneProvider` abstraction used to convert date-only values into start/end-of-day
boundaries and to group records by day, week, or month. The open question was not whether services should use this
abstraction, but which timezone source should be used in each runtime context.

There are two distinct user contexts:

1. CLI commands run in an operator-controlled environment and should use the configured project timezone from
   `Configuration.timezone`.
2. REST/dashboard requests are initiated from a browser. The browser user's timezone is the correct timezone for
   interpreting date-only filters and period grouping in the dashboard.

Using `Configuration.timezone` for REST/dashboard filtering can produce surprising results when the configured project
timezone differs from the user's browser timezone. Removing `TimeZoneProvider` from services is also incorrect because
date-only filtering, grouping, and boundary calculation still need one consistent timezone-aware abstraction.

## Decision

Services and repositories that depend on timezone behavior must continue to receive a `TimeZoneProvider`.

The source of that provider depends on the execution path:

- CLI and core factory defaults use `Configuration.timezone`.
- REST uses a request-scoped `TimeZoneProvider` created from a browser-provided `timezone` query parameter.
- If REST receives no valid browser timezone, it falls back to `Configuration.timezone`, then `UTC`.

The webapp sends the browser timezone as an IANA timezone string using:

```ts
Intl.DateTimeFormat().resolvedOptions().timeZone
```

For example:

```text
timezone=Europe/Madrid
```

REST exposes this value through dependency injection by creating a request-scoped `TimeZoneProvider`. Repositories and
services that perform cached filtering or grouping receive this request-scoped provider.

## Date and Datetime Interpretation

Date-only values and datetime values are intentionally treated differently.

Date-only values, such as:

```text
2026-01-05
```

are interpreted as calendar days in the active `TimeZoneProvider`:

- start boundary: beginning of that day in the provider timezone
- end boundary: end of that day in the provider timezone

Datetime values with an offset, such as:

```text
2026-01-05T08:30:00+01:00
```

are treated as exact instants. They are not expanded to start or end of day.

This keeps backward compatibility for date-only filters while making date-time filters precise.

## Fetching Data

Provider fetch logic may still use `Configuration.timezone` when the fetch operation needs project-level date windows.

For example, GitHub pipeline day-by-day fetches use `Configuration.timezone` to convert date-only fetch windows into UTC
ranges for provider API calls. This is separate from REST/dashboard filtering and grouping, which uses the browser
timezone provider.

## Consequences

### Positive

- REST/dashboard filtering and grouping match the user's browser timezone.
- CLI behavior remains stable and continues to respect `Configuration.timezone`.
- `TimeZoneProvider` remains the single abstraction for timezone-aware boundaries and period keys.
- Date-only filters remain backward compatible.
- Datetime filters remain exact because offset-aware ISO timestamps are parsed as instants.

### Negative

- REST callers must send a `timezone` query parameter for fully correct browser-local behavior.
- URLs now include an additional filter parameter when used from the webapp.
- Invalid browser timezone values need validation and fallback handling.

### Neutral

- Cached filtering, grouping, and provider fetch windows can use different timezone sources by design.
- Existing date-only CLI commands keep their configured-timezone semantics.
- Code paths that already pass full offset-aware datetimes are largely unaffected because those values are exact
  instants.

## Alternatives Considered

1. Always use `Configuration.timezone`.

   This keeps behavior simple but makes dashboard results dependent on project configuration instead of the user's
   browser context. It is wrong for REST/dashboard users in a different timezone.

2. Remove `TimeZoneProvider` from filtering services.

   This loses correct date-only boundary handling and period grouping. Services still need a timezone-aware abstraction;
   only the provider source changes.

3. Always use UTC.

   This is deterministic but does not match either browser-local dashboard behavior or configured CLI behavior.

4. Infer browser timezone from datetime offsets only.

   Offset-aware datetimes are enough for exact datetime filters, but they are not enough for date-only filters or period
   grouping. An IANA timezone is still needed for daylight saving transitions and calendar grouping.

## Notes

This ADR does not describe the date picker UI. It only documents the timezone source and interpretation rules used by
the REST, CLI, and core service layers.
