#!/bin/bash
# Scrape Islamic bookstores for book data (titles, ISBNs, etc.)
# Output: islamic_books.jsonl

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="${SCRIPT_DIR}/../islamic_books.jsonl"

> "$OUTPUT"

scrape_shopify() {
  local base_url="$1"
  local source="$2"
  local page=1

  while true; do
    echo "Scraping $source page $page..." >&2
    data=$(curl -s "${base_url}/products.json?limit=250&page=$page" -H 'user-agent: Mozilla/5.0')
    count=$(echo "$data" | jq '.products | length')

    if [ "$count" = "0" ] || [ "$count" = "null" ]; then
      break
    fi

    echo "$data" | jq -c --arg src "$source" '.products[] | {
      title: .title,
      vendor: .vendor,
      sku: (.variants[0].sku // ""),
      price: (.variants[0].price // ""),
      handle: .handle,
      tags: .tags,
      source: $src
    }' >> "$OUTPUT"

    ((page++))
    sleep 0.5
  done
}

scrape_woocommerce() {
  local base_url="$1"
  local source="$2"
  local page=1

  while true; do
    echo "Scraping $source page $page..." >&2

    data=$(curl -s "${base_url}/wp-json/wc/store/v1/products?per_page=100&page=$page" \
      -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

    count=$(echo "$data" | jq 'if type == "array" then length else 0 end' 2>/dev/null)

    if [ "$count" = "0" ] || [ "$count" = "null" ] || [ -z "$count" ]; then
      break
    fi

    echo "$data" | jq -c --arg src "$source" '.[] | {
      title: .name,
      vendor: "",
      sku: .sku,
      price: .prices.price,
      handle: .slug,
      tags: [],
      source: $src
    }' >> "$OUTPUT"

    echo "Got $count products" >&2
    ((page++))
    sleep 0.5

    if [ "$page" -gt 100 ]; then
      echo "Reached page limit" >&2
      break
    fi
  done
}

echo "Starting scrape..."

# Shopify stores
scrape_shopify "https://darussalam.uk" "darussalam.uk"
scrape_shopify "https://darassunnah.com" "darassunnah.com"
scrape_shopify "https://www.daral-arqam.co.uk" "daral-arqam.co.uk"

# WooCommerce stores
scrape_woocommerce "https://salafibookstore.com" "salafibookstore.com"

# Summary
total=$(wc -l < "$OUTPUT")
with_isbn=$(jq -r '.sku' "$OUTPUT" | grep -cE '^97[89][0-9]{10}$' || echo 0)

echo ""
echo "=== Summary ==="
echo "Total products: $total"
echo "With valid ISBN-13: $with_isbn"
echo "Output: $OUTPUT"
