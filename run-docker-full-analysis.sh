#!/bin/bash

GITHUB_TOKEN=$1
BASE_DIR=$2
IMAGE_NAME=$3

project="ollama"
github_repo="ollama/ollama"

# project="vitepress"
# github_repo="vuejs/vitepress"

#project="smelly-test"
#github_repo="marabesi/smelly-test"

# project="marabesi"
# github_repo="marabesi/software-metrics-machine"

#project="marabesi"
#github_repo="marabesi/json-tool"

# project="vercel"
# github_repo="vercel/next.js"

repo_url="https://github.com/$github_repo.git"

base_dir="$BASE_DIR"
clone_dir="$base_dir/$project"
analysis_dir="$base_dir/${project}_analysis"
main_branch="main"

start_date="2025-07-01"
end_date="2025-07-06"

export SMM_STORE_DATA_AT="$analysis_dir"

# if [ "$1" == "d" ]; then
#   ./run-dashboard.sh
#   exit
# fi

# if [ "$1" != "" ]; then
#   ./run-cli.sh "$@"
#   exit
# fi

if [ ! -d "$clone_dir" ]; then
  git clone "$repo_url" "$clone_dir"
else
  echo "Repository already cloned at $clone_dir"
fi

rm -rf "$analysis_dir"
mkdir -p "$analysis_dir"

TEMPLATE=$(cat <<EOF
  {
    "git_provider": "github",
    "github_token": "$GITHUB_TOKEN",
    "github_repository": "$github_repo",
    "git_repository_location": "/ollama",
    "deployment_frequency_target_pipeline": "",
    "deployment_frequency_target_job": "",
    "main_branch": "$main_branch",
    "logging_level": "DEBUG"
  }
EOF
)


echo "$TEMPLATE" > "$analysis_dir/smm_config.json"

docker stop smm || true

docker run \
  -e SMM_STORE_DATA_AT="/data" \
  -v $(pwd)/downloads/ollama:/ollama \
  -v $(pwd)/downloads/ollama_analysis:/data \
  --rm $IMAGE_NAME smm code fetch --start-date "$start_date" --end-date "$end_date"

 docker run -d --rm \
   --name smm \
   -p 5006:5006 \
   -e SMM_STORE_DATA_AT="/data" \
   -v $(pwd)/downloads/ollama:/ollama \
   -v $(pwd)/downloads/ollama_analysis:/data \
   $IMAGE_NAME \
   smm-dashboard

#docker run --rm $IMAGE_NAME smm prs fetch --start-date "$start_date" --end-date "$end_date"
#docker run --rm $IMAGE_NAME smm prs fetch-comments --start-date "$start_date" --end-date "$end_date"
#docker run --rm $IMAGE_NAME smm pipelines fetch --start-date "$start_date" --end-date "$end_date"
#docker run --rm $IMAGE_NAME smm pipelines jobs-fetch --start-date "$start_date" --end-date "$end_date"
#
#./run-cli.sh pipelines summary
#./run-cli.sh prs summary

# ./run-dashboard.sh
