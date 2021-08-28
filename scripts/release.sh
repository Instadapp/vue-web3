#!/bin/bash

# Restore all git changes
git restore -s@ -SW  -- example src test

# Resolve yarn
yarn

# Update token
if [[ ! -z ${NODE_AUTH_TOKEN} ]] ; then
  echo "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}" >> ~/.npmrc
  echo "registry=https://registry.npmjs.org/" >> ~/.npmrc
  echo "always-auth=true" >> ~/.npmrc
  npm whoami
fi

# Get package name from package.json
PACKAGE_NAME=$(
  cat package.json \
  | grep name \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g'
)

# Release package
echo "🚀 Publishing$PACKAGE_NAME"
if npm publish -q --access public ; then
    echo "✅ Published$PACKAGE_NAME"
else
    echo "❌ Could'nt publish$PACKAGE_NAME"
fi