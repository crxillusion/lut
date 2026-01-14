#!/bin/bash
# Script to remove Git LFS and commit videos directly
# Only run this if deployment keeps failing with LFS

echo "⚠️  This will remove Git LFS and commit videos directly to the repo"
echo "Total video size: 52MB (within GitHub's 100MB per-file limit)"
read -p "Continue? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# Untrack files from LFS
git lfs untrack "*.mp4"

# Remove LFS configuration
rm -f .gitattributes

# Uninstall LFS from repo
git lfs uninstall

# Remove LFS pointer files and restore actual files
git add --renormalize .

# Commit the changes
git commit -m "Remove Git LFS - commit videos directly (52MB total)"

echo "✅ LFS removed. Videos will be committed directly."
echo "Run 'git push --force' to update remote (⚠️  this will rewrite history)"
