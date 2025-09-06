#!/bin/bash

git_directory=$GIT_REPOSITORY_LOCATION
store_data="$STORE_DATA_AT"
start_date=$1
sub_folder=$2

if [ -z "$git_directory" ]; then
  echo "❌ GIT_REPOSITORY_LOCATION is not set. Export GIT_REPOSITORY_LOCATION to point the git repository to be used."
  exit 1
fi

if [ -z "$store_data" ]; then
  echo "❌ STORE_DATA_AT is not set. Export STORE_DATA_AT to a directory where results will be written."
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
codemaat="$current/providers/codemaat/tools/code-maat-1.0.4-standalone.jar"

#clean up
rm -rf $store_data/$git_log_file

echo "Extracting git log from $git_directory since $start_date for directory..."

cd $git_directory && \
git log --pretty=format:'[%h] %aN %ad %s' --date=short --numstat --after=$start_date $target_directory > "$store_data/$git_log_file" && \
cd $current

echo "Git log extracted to $store_data/$git_log_file"

echo "Running CodeMaat analyses... this may take a while depending on the size of the repository."

echo "Running age data extraction ..."
java -jar $codemaat -l "$store_data/$git_log_file" -c git -a age > "$store_data/age.csv"
echo "Done."

echo "Running abs-churn data extraction ..."
java -jar $codemaat -l "$store_data/$git_log_file" -c git -a abs-churn > "$store_data/abs-churn.csv"
echo "Done."

echo "Running author-churn data extraction ..."
java -jar $codemaat -l "$store_data/$git_log_file" -c git -a author-churn > "$store_data/author-churn.csv"
echo "Done."

echo "Running entity-ownership data extraction ..."
java -jar $codemaat -l "$store_data/$git_log_file" -c git -a entity-ownership > "$store_data/entity-ownership.csv"
echo "Done."

echo "Running entity-effort data extraction ..."
java -jar $codemaat -l "$store_data/$git_log_file" -c git -a entity-effort > "$store_data/entity-effort.csv"
echo "Done."

echo "Running entity-churn data extraction ..."
java -jar $codemaat -l "$store_data/$git_log_file" -c git -a entity-churn > "$store_data/entity-churn.csv"
echo "Done."

echo "Running coupling data extraction ..."
java -jar $codemaat -l "$store_data/$git_log_file" -c git -a coupling > "$store_data/coupling.csv"
echo "Done."