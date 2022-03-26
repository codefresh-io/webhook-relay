#!/bin/sh

find ../apps -maxdepth 1 -mindepth 1 -type d -exec basename {} \; | while IFS= read -r APP ; do

CONFIG=$(sed '/import/d' ../apps/$APP/src/config/types/index.ts | sed '/./,$!d')

echo "# $APP

## Configuration

\`\`\`typescript
$CONFIG
\`\`\`
" > /tmp/README.tmp.md && mv /tmp/README.tmp.md ../apps/$APP/README.md

done


