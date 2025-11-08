#!/usr/bin/env bun
/**
 * Generate Cache Manifest
 *
 * Scans the dist/ directory after build and generates a manifest of assets
 * to be cached by the service worker. Identifies critical assets that should
 * be pre-cached for offline functionality.
 *
 * Run after build: bun run scripts/generate-cache-manifest.ts
 */

import { readdir, stat, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

interface AssetEntry {
  path: string
  size: number
  type: string
  critical: boolean
}

interface CacheManifest {
  version: string
  generatedAt: string
  assets: AssetEntry[]
}

// Size threshold for critical assets (200KB)
const CRITICAL_SIZE_THRESHOLD = 200 * 1024

// Patterns for critical assets (should be pre-cached)
const CRITICAL_PATTERNS = [
  /^index\.html$/,
  /^dashboard\.html$/,
  /^settings\.html$/,
  /\.css$/,
  /^_astro\/.*\.js$/,  // Astro bundles
  /^favicon\./,
]

// Patterns for assets to exclude from manifest
const EXCLUDE_PATTERNS = [
  /\.map$/,           // Source maps
  /^\.well-known\//,  // Well-known directory
  /^api\//,           // API routes
]

/**
 * Get MIME type based on file extension
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    avif: 'image/avif',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

/**
 * Check if an asset should be excluded
 */
function shouldExclude(path: string): boolean {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(path))
}

/**
 * Check if an asset is critical and should be pre-cached
 */
function isCritical(path: string, size: number): boolean {
  // Don't pre-cache large files
  if (size > CRITICAL_SIZE_THRESHOLD) {
    return false
  }

  // Check if matches critical patterns
  return CRITICAL_PATTERNS.some((pattern) => pattern.test(path))
}

/**
 * Recursively scan directory and collect assets
 */
async function scanDirectory(
  dir: string,
  baseDir: string,
  assets: AssetEntry[]
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const relativePath = relative(baseDir, fullPath)

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      await scanDirectory(fullPath, baseDir, assets)
    } else if (entry.isFile()) {
      // Check if should be excluded
      if (shouldExclude(relativePath)) {
        continue
      }

      // Get file stats
      const stats = await stat(fullPath)

      // Add to assets list
      const asset: AssetEntry = {
        path: '/' + relativePath.replace(/\\/g, '/'), // Normalize path separators
        size: stats.size,
        type: getMimeType(entry.name),
        critical: isCritical(relativePath, stats.size),
      }

      assets.push(asset)
    }
  }
}

/**
 * Generate cache manifest
 */
async function generateManifest(): Promise<void> {
  console.log('🔍 Scanning dist/ directory for assets...')

  const distDir = join(process.cwd(), 'dist')
  const assets: AssetEntry[] = []

  try {
    // Scan dist directory
    await scanDirectory(distDir, distDir, assets)

    // Sort assets: critical first, then by path
    assets.sort((a, b) => {
      if (a.critical && !b.critical) return -1
      if (!a.critical && b.critical) return 1
      return a.path.localeCompare(b.path)
    })

    // Create manifest
    const manifest: CacheManifest = {
      version: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
      assets,
    }

    // Write manifest to public directory
    const manifestPath = join(process.cwd(), 'public', 'cache-manifest.json')
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')

    // Also write to dist for production use
    const distManifestPath = join(distDir, 'cache-manifest.json')
    await writeFile(distManifestPath, JSON.stringify(manifest, null, 2), 'utf-8')

    // Print summary
    const criticalAssets = assets.filter((a) => a.critical)
    const totalSize = assets.reduce((sum, a) => sum + a.size, 0)
    const criticalSize = criticalAssets.reduce((sum, a) => sum + a.size, 0)

    console.log('✅ Cache manifest generated successfully!')
    console.log(`   Total assets: ${assets.length}`)
    console.log(`   Critical assets: ${criticalAssets.length}`)
    console.log(`   Total size: ${(totalSize / 1024).toFixed(2)} KB`)
    console.log(`   Critical size: ${(criticalSize / 1024).toFixed(2)} KB`)
    console.log(`   Manifest saved to: ${manifestPath}`)

    // List critical assets
    if (criticalAssets.length > 0 && criticalAssets.length <= 20) {
      console.log('\n📦 Critical assets to pre-cache:')
      criticalAssets.forEach((asset) => {
        console.log(`   - ${asset.path} (${(asset.size / 1024).toFixed(2)} KB)`)
      })
    }
  } catch (error) {
    console.error('❌ Failed to generate cache manifest:', error)
    process.exit(1)
  }
}

// Run the script
generateManifest()

