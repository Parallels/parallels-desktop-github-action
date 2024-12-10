#!/bin/bash

# Exit on any error
set -e

# Function to show usage
function show_usage() {
  echo "Usage: $0 -s <src_folder> -r <dest_repo> -d <dest_folder> -b <branch_name> -t <personal_access_token>"
  echo ""
  echo "Parameters:"
  echo "  --src           Source folder containing the markdown files."
  echo "  --repo          Destination repository (e.g., 'https://github.com/user/repo.git')."
  echo "  --dest-folder   Destination folder in the destination repository."
  echo "  --branch-name   Branch name for the pull request (default: 'update-docs')."
  echo "  --pat           GitHub Personal Access Token (PAT) for authentication."
  echo ""
  exit 1
}

function update_version_in_files() {
  folder="$1"
  version=$(cat VERSION)

  find "$folder" -type f -name "*.md" | while read -r file; do
    echo "Updating version in $file..."
    sed -i "s/^version: .*/version: $version/g" "$file"
  done
}

function cleanup() {
  echo "Cleaning up..."
  folder_to_delete="$1"
  current_dir=$(pwd)

  if [[ "$current_dir" == "$folder_to_delete" ]]; then
    cd ..
  fi

  rm -rf "$1"
}

# Default branch name
branch_name="update-docs"
src_folder=""
dest_repo=""
dest_folder=""
pat=""
auto_merge=false

while [[ $# -gt 0 ]]; do
  case $1 in
  --src)
    src_folder=$2
    shift
    shift
    ;;
  --repo)
    dest_repo=$2
    shift
    shift
    ;;
  --dest-folder)
    dest_folder=$2
    shift
    shift
    ;;
  --branch-name)
    branch_name=$2
    shift
    shift
    ;;
  --pat)
    pat=$2
    shift
    shift
    ;;
  --auto-merge)
    auto_merge=true
    shift
    ;;
  *)
    echo "Invalid argument: $1" >&2
    show_usage
    ;;
  esac
done

# Check required parameters
if [[ -z "$src_folder" || -z "$dest_repo" || -z "$dest_folder" || -z "$pat" ]]; then
  show_usage
fi

# checking if we have the gh tool installed
if ! command -v gh &>/dev/null; then
  echo "GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/" >&2
  exit 1
fi

src_folder=$(realpath "$src_folder")
branch_name=$(echo "$branch_name" | tr -d '[:space:]')
date_suffix=$(date +"%m%d%y%H%M")
branch_name="${branch_name}-${date_suffix}"

# Check if the source folder exists
if [[ ! -d "$src_folder" ]]; then
  echo "Source folder '$src_folder' does not exist." >&2
  exit 1
fi

# update version in the documents
update_version_in_files "$src_folder"

# Get repository name from URL
repo_name=$(basename -s .git "$dest_repo")
temp_dir=$(mktemp -d)

echo "Cloning destination repository..."
git clone --depth 1 "$dest_repo" "$temp_dir"

cd "$temp_dir"

echo "Creating a new branch..."
git checkout -b "$branch_name"

echo "Copying files from source folder..."
mkdir -p "$dest_folder"
cp -r "$src_folder"/* "$dest_folder/"

echo "Adding changes to git..."
git add .
if [[ $(git status --porcelain) == "" ]]; then
  echo "No changes to commit."
  cleanup "$temp_dir"
  exit 0
fi

echo "Committing changes..."
commit_message=$(git commit -m "Update documentation files for $repo_name")
if [[ "$commit_message" == *"working tree clean"* ]]; then
  echo "No changes to commit."
  cleanup "$temp_dir"
  exit 0
fi

if [[ $? -ne 0 ]]; then
  echo "Cleaning up..."
  cleanup "$temp_dir"
  echo "Failed to commit changes."
  exit 1
fi

echo "Pushing changes to remote repository..."
git push origin "$branch_name"

# Create a pull request
echo "Creating a pull request..."
pr_response=$(curl -s -X POST \
  -H "Authorization: token $pat" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${dest_repo#https://github.com/}/pulls" \
  -d "{
        \"title\": \"Update documentation\",
        \"head\": \"$branch_name\",
        \"base\": \"main\"
    }")

# Extract pull request URL and number
pr_url=$(echo "$pr_response" | jq -r '.html_url')
pr_number=$(echo "$pr_response" | jq -r '.number')
echo "pr_url: $pr_url"
echo "pr_number: $pr_number"

if [[ "$pr_url" == "null" ]]; then
  echo "Cleaning up..."
  cleanup "$temp_dir"
  echo "Failed to create a pull request."
  echo "$pr_response"
  exit 1
fi

# Patch the pull request  to add labels
echo "Adding labels to the pull request..."
labels_response=$(gh pr edit "$pr_number" --add-label "documentation" --add-label "sync")
if [[ $? -ne 0 ]]; then
  echo "Cleaning up..."
  cleanup "$temp_dir"
  echo "Failed to add labels to the pull request."
  exit 1
fi

echo "Enabling auto-merge for the pull request..."
auto_merge_response=$(gh pr merge "$pr_number" --auto --squash)
if [[ $? -ne 0 ]]; then
  echo "Cleaning up..."
  cleanup "$temp_dir"
  echo "Failed to enable auto-merge for the pull request."
  exit 1
fi

if [[ "$auto_merge" == "false" ]]; then
  echo "Review the pull request at: $pr_url"
  review_response=$(gh pr review "$pr_number" --approve)
  if [[ $? -ne 0 ]]; then
    echo "Cleaning up..."
    cleanup "$temp_dir"
    echo "Failed to approve the pull request."
    exit 1
  fi
fi

echo "Pull request created: $pr_url"
# echo "Pull request number: $pr_number"

if [[ "$auto_merge" == "true" ]]; then
  # Merge the pull request
  echo "Merging the pull request..."
  merge_response=$(curl -s -X PUT \
    -H "Authorization: token $pat" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${dest_repo#https://github.com/}/pulls/$pr_number/merge" \
    -d "{
        \"commit_title\": \"Merge pull request #$pr_number - Update documentation\",
        \"merge_method\": \"squash\"
    }")

  if [[ "$(echo "$merge_response" | jq -r '.merged')" != "true" ]]; then
    echo "Failed to merge the pull request."
    echo "$merge_response"
    cleanup "$temp_dir"
    exit 1
  fi

  echo "Pull request merged successfully."
fi

#Clean up
cleanup "$temp_dir"

echo "Documentation sync completed successfully!"
