#!/bin/bash
# Bundle Lambda functions — copies shared/utils.mjs into each function
# and fixes the import path. Run before `cdk deploy`.

set -e
cd "$(dirname "$0")/.."

SHARED="shared/utils.mjs"
DOMAINS_DIR="domains"

echo "Bundling Lambda functions..."

for FUNC_DIR in $(find "$DOMAINS_DIR" -type d -name "lambdas" -exec find {} -mindepth 1 -maxdepth 1 -type d \;); do
  FUNC_NAME=$(basename "$FUNC_DIR")

  # Copy shared utils
  cp "$SHARED" "$FUNC_DIR/utils.mjs"

  # Fix import path in index.mjs
  if [ -f "$FUNC_DIR/index.mjs" ]; then
    sed -i 's|../../../../shared/utils.mjs|./utils.mjs|g' "$FUNC_DIR/index.mjs"
    sed -i 's|../../../shared/utils.mjs|./utils.mjs|g' "$FUNC_DIR/index.mjs"
    echo "  Bundled: $FUNC_NAME"
  fi
done

echo "All Lambda functions bundled."
