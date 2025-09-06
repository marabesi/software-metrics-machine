import json
import argparse
from typing import List
from datetime import datetime
from workflows.repository_workflows import LoadWorkflows
import locale as pylocale


def datetime_to_local(date: str, locale: str = 'en_US.UTF-8') -> str:
    if not date:
        return "<none>"
    try:
        prev = pylocale.setlocale(pylocale.LC_TIME)
    except Exception:
        prev = None
    try:
        try:
            pylocale.setlocale(pylocale.LC_TIME, locale)
        except Exception:
            pass
        try:
            dt = datetime.fromisoformat(date.replace('Z', '+00:00'))
        except Exception:
            return "<invalid>"
        return dt.astimezone().strftime('%c')
    finally:
        try:
            if prev is not None:
                pylocale.setlocale(pylocale.LC_TIME, prev)
        except Exception:
            pass


def summarize_runs(runs: List[dict]) -> dict:
    summary = {}
    total = len(runs)
    summary['total_runs'] = total
    if total == 0:
        summary.update({
            'first_run': None,
            'last_run': None,
            'completed': 0,
            'in_progress': 0,
            'queued': 0,
            'unique_workflows': 0,
        })
        return summary

    # assume runs are in chronological order; take first and last
    first = runs[0]
    last = runs[-1]
    summary['first_run'] = first
    summary['last_run'] = last

    completed = [r for r in runs if r.get('status') == 'completed']
    in_progress = [r for r in runs if r.get('status') in ('in_progress', 'queued')]

    summary['completed'] = len(completed)
    summary['in_progress'] = len([r for r in runs if r.get('status') == 'in_progress'])
    summary['queued'] = len([r for r in runs if r.get('status') == 'queued'])

    workflows = {r.get('name') for r in runs if r.get('name')}
    summary['unique_workflows'] = len(workflows)

    return summary

def print_run(first, last) -> None:
    print('')
    print('First run:')
    created_at = first.get('created_at')
    started_at = first.get('run_started_at')
    ended_at = first.get('updated_at')
    print(f"  Created at: {datetime_to_local(created_at)}")
    print(f"  Started run at: {datetime_to_local(started_at)}")
    print(f"  Updated run at: {datetime_to_local(ended_at)} (Ended at)")
    
    print('')
    print('Last run:')
    created_at = last.get('created_at')
    started_at = last.get('run_started_at')
    ended_at = last.get('updated_at')
    print(f"  Created at: {datetime_to_local(created_at)}")
    print(f"  Started run at: {datetime_to_local(started_at)}")
    print(f"  Updated run at: {datetime_to_local(ended_at)} (Ended at)")

def print_summary(summary: dict) -> None:
    if summary.get('total_runs', 0) == 0:
        print('No workflow runs available.')
        return

    print('')
    print('Workflow runs summary:')
    print(f"  Total runs: {summary['total_runs']}")
    print(f"  Completed runs: {summary['completed']}")
    print(f"  In-progress runs: {summary['in_progress']}")
    print(f"  Queued runs: {summary['queued']}")

    # print first/last with formatted dates
    first = summary['first_run']
    last = summary['last_run']

    print_run(first, last)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Print a quick summary of workflow runs')
    args = parser.parse_args()

    lw = LoadWorkflows()
    runs = lw.runs()
    summary = summarize_runs(runs)
    print_summary(summary)
