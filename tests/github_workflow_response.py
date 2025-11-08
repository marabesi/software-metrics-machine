def successfull_response_with_single_job():
    return {
        "total_count": 1,
        "jobs": [
            {
                "id": 1,
                "run_id": 1,
                "workflow_name": "Node CI",
                "run_attempt": 1,
                "node_id": "CR_kwDOF2CqAc8AAAALeduliQ",
                "url": "https://api.github.com/repos/marabesi/json-tool/actions/jobs/49289078153",
                "html_url": "https://github.com/marabesi/json-tool/actions/runs/17364448040/job/49289078153",
                "status": "completed",
                "conclusion": "success",
                "created_at": "2025-09-01T00:37:44Z",
                "started_at": "2025-09-01T00:37:46Z",
                "completed_at": "2025-09-01T00:38:14Z",
                "name": "build",
                "steps": [
                    {
                        "name": "Set up job",
                        "status": "completed",
                        "conclusion": "success",
                        "number": 1,
                        "started_at": "2025-09-01T00:37:47Z",
                        "completed_at": "2025-09-01T00:37:48Z",
                    }
                ],
            }
        ],
    }


def successfull_response_with_empty_jobs():
    return {
        "total_count": 0,
        "jobs": [],
    }
