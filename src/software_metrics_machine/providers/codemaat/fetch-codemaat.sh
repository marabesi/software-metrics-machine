#!/bin/bash

git_directory=$1
store_data=$2
start_date=$3
sub_folder=$4
force=$5

if [ -z "$git_directory" ]; then
  echo "❌ SMM_GIT_REPOSITORY_LOCATION is not set. Export SMM_GIT_REPOSITORY_LOCATION to point the git repository to be used."
  exit 1
fi

if [ -z "$store_data" ]; then
  echo "❌ SMM_STORE_DATA_AT is not set. Export SMM_STORE_DATA_AT to a directory where results will be written."
  exit 1
fi

if [ ! -d "$store_data" ]; then
  echo "Directory $store_data does not exist. Creating..."
fi

if [ ! -w "$store_data" ]; then
  echo "Directory $store_data is not writable. Check permissions."
  exit 1
fi

if [ -z "$start_date" ]; then
  echo "Run the script with a valid start date e.g., './fetch-codemaat.sh 2023-01-01'. This date will be used as a starting point for the git log extraction."
  exit 1
fi

current=$(pwd)

if [ -n "$sub_folder" ]; then
  target_directory="$sub_folder"
else
  target_directory=""
fi

git_log_file="logfile.log"
codemaat="$current/src/software_metrics_machine/providers/codemaat/tools/code-maat-1.0.4-standalone.jar"

#clean up
rm -rf $store_data/$git_log_file

echo "Extracting git log from $git_directory since $start_date for directory..."

cd $git_directory && \
git log --pretty=format:'[%h] %aN %ad %s' --date=short --numstat --after=$start_date $target_directory > "$store_data/$git_log_file" && \
cd $current

echo "Git log extracted to $store_data/$git_log_file"

echo "Running CodeMaat analyses... this may take a while depending on the size of the repository."

echo "Running age data extraction ..."

# ensure codemaat jar exists
if [ ! -f "$codemaat" ]; then
  echo "❌ CodeMaat jar not found at $codemaat. Please ensure the file exists."
  exit 1
fi

# helper to run codemaat action and skip if output exists
run_codemaat() {
  local action="$1"
  local out="$2"
  local outpath="$store_data/$out"
  if [ "$force" = false ]; then
    if [ -f "$outpath" ] && [ -s "$outpath" ]; then
      echo "Skipping $action: output already exists at $outpath"
      return
    fi
  else
    echo "Force mode: regenerating $outpath"
  fi
  echo "Running $action data extraction ..."
  java -jar "$codemaat" -l "$store_data/$git_log_file" -c git -a "$action" > "$outpath"
  echo "Done."
}

run_codemaat age age.csv
run_codemaat abs-churn abs-churn.csv
run_codemaat author-churn author-churn.csv
run_codemaat entity-ownership entity-ownership.csv
run_codemaat entity-effort entity-effort.csv
run_codemaat entity-churn entity-churn.csv
run_codemaat coupling coupling.csv

echo "..."
echo "..."

echo "Done"