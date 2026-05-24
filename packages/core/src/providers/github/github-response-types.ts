export type WorkflowJsonResponse = {
  id: string;
  name: string;
  node_id: string;
  head_branch: string;
  head_sha: string;
  path: string;
  display_title: string;
  run_number: string;
  event: string;
  status: string;
  conclusion: string;
  workflow_id: string;
  check_suite_id: string;
  check_suite_node_id: string;
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_attempt: string;
  run_started_at: string;
};

export type WorkflowJobJsonResponse = {
  id: string;
  run_id: string;
  workflow_name: string;
  head_branch: string;
  run_url: string;
  run_attempt: string;
  node_id: string;
  head_sha: string;
  url: string;
  html_url: string;
  status: string;
  conclusion: string;
  created_at: string;
  started_at: string;
  completed_at: string;
  name: string;
};

export type PullRequestJsonResponse = {
  url: string;
  id: string;
  node_id: string;
  html_url: string;
  diff_url: string;
  patch_url: string;
  issue_url: string;
  number: string;
  state: string;
  locked: boolean;
  title: string;
};
