#!/bin/bash

# brand-linter.sh
# Checks for hardcoded brand names in the codebase.
# Excludes allowed files like brand.json, site_settings seed, and the linter itself.

BRAND_NAME="GoldMoodAstro"
BRAND_NAME_LOWER="goldmoodastro"
DOMAIN="goldmoodastro.com"

echo "Checking for hardcoded literals: $BRAND_NAME, $BRAND_NAME_LOWER, $DOMAIN"

# Search in frontend/src
echo "Searching frontend/src..."
grep -rEi "$BRAND_NAME|$DOMAIN" frontend/src \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude="brand.json" \
  --exclude="*.css" \
  --exclude="*.svg" \
  --exclude="*.png" \
  | grep -vE "fallback|ui\(|brand\." # Allow fallbacks and ui() calls

# Search in backend/src
echo "Searching backend/src..."
grep -rEi "$BRAND_NAME|$DOMAIN" backend/src \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude="*.sql" \
  | grep -vE "fallback|brand\."

echo "Linter finished."
