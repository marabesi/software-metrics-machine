#!/bin/bash

export SMM_STORE_DATA_AT=$1

start_date=2026-04-26
end_date=2026-04-26

pnpm run build

#pnpm run --filter=cli dev pipelines fetch --start-date=$start_date --end-date=$end_date
pnpm run --filter=cli dev pipelines fetch-jobs --run-start-date=$start_date --run-end-date=$end_date

##pnpm run --filter=cli dev pipelines summary --output=json
#pnpm run --filter=cli dev pipelines jobs-summary --output=json
