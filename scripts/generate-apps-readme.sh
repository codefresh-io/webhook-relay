#!/bin/sh

set -e
# set -o pipefail

find "$PWD/apps" -maxdepth 1 -mindepth 1 -type d -exec basename {} \; | while IFS= read -r APP ; do

CONFIG=$(sed '/import/d' "$PWD/apps/$APP/src/config/types/index.ts" | sed '/./,$!d')

echo "# $APP

## Configuration

\`\`\`typescript
$CONFIG
\`\`\`
" > /tmp/README.tmp.md && mv /tmp/README.tmp.md "$PWD/apps/$APP/README.md"

done

echo OK
