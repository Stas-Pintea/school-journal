param()

$ErrorActionPreference = "Stop"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git is not installed or not in PATH"
}

try {
  git rev-parse --is-inside-work-tree *> $null
} catch {
  throw "Current folder is not a git repository. Initialize git first: git init"
}

git config core.hooksPath .githooks
Write-Host "Git hooks path set to .githooks"
Write-Host "pre-commit hook is now active."

