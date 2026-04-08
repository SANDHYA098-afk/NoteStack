#!/bin/bash
# NoteStack Test Runner
# Uses Node.js built-in test runner (no npm install needed)
# Run: node --test tests/backend/

echo "=========================================="
echo " NoteStack Test Suite"
echo "=========================================="
echo ""

echo "--- Backend Tests ---"
node --test tests/backend/test-utils.mjs
node --test tests/backend/test-toggle-star.mjs
node --test tests/backend/test-notes-crud.mjs
node --test tests/backend/test-notifications.mjs
node --test tests/backend/test-sharing.mjs
node --test tests/backend/test-file-validation.mjs

echo ""
echo "=========================================="
echo " All tests complete"
echo "=========================================="
