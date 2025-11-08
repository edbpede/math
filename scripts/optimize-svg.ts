/**
 * SVG Optimization Script
 * 
 * Optimizes SVG files by removing unnecessary elements,
 * whitespace, and comments while preserving visual quality.
 * 
 * Requirements: 13.4 - Inline small SVG icons
 * 
 * Note: This is a simple optimization. For production, consider using
 * SVGO (npm install -D svgo) for more comprehensive optimization.
 * 
 * Usage: bun run scripts/optimize-svg.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const PUBLIC_DIR = join(process.cwd(), 'public')
const ICONS_DIR = join(PUBLIC_DIR, 'icons')

/**
 * Simple SVG minification (removes whitespace and comments)
 */
function minifySVG(svgContent: string): string {
  return svgContent
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove unnecessary whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace between tags
    .replace(/>\s+</g, '><')
    // Trim
    .trim()
}

/**
 * Add viewBox if missing (important for responsive SVGs)
 */
function ensureViewBox(svgContent: string): string {
  // If already has viewBox, return as is
  if (svgContent.includes('viewBox=')) {
    return svgContent
  }
  
  // Try to extract width and height
  const widthMatch = svgContent.match(/width="(\d+)"/)
  const heightMatch = svgContent.match(/height="(\d+)"/)
  
  if (widthMatch && heightMatch) {
    const width = widthMatch[1]
    const height = heightMatch[1]
    
    // Insert viewBox attribute
    return svgContent.replace(
      '<svg',
      `<svg viewBox="0 0 ${width} ${height}"`
    )
  }
  
  return svgContent
}

/**
 * Optimize a single SVG file
 */
function optimizeSVGFile(filePath: string): { original: number; optimized: number } {
  const content = readFileSync(filePath, 'utf-8')
  const originalSize = Buffer.byteLength(content, 'utf-8')
  
  let optimized = minifySVG(content)
  optimized = ensureViewBox(optimized)
  
  const optimizedSize = Buffer.byteLength(optimized, 'utf-8')
  
  // Write optimized version
  writeFileSync(filePath, optimized, 'utf-8')
  
  return { original: originalSize, optimized: optimizedSize }
}

/**
 * Find all SVG files in a directory
 */
function findSVGFiles(dir: string, files: string[] = []): string[] {
  const items = readdirSync(dir)
  
  for (const item of items) {
    const itemPath = join(dir, item)
    const stat = statSync(itemPath)
    
    if (stat.isDirectory()) {
      findSVGFiles(itemPath, files)
    } else if (extname(item) === '.svg') {
      files.push(itemPath)
    }
  }
  
  return files
}

/**
 * Format file size for display
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Main execution
 */
function main() {
  console.log('🎨 SVG Optimization Script\n')
  
  // Find all SVG files in public directory
  const svgFiles = findSVGFiles(PUBLIC_DIR)
  
  if (svgFiles.length === 0) {
    console.log('⚠️  No SVG files found in public directory')
    return
  }
  
  console.log(`Found ${svgFiles.length} SVG file(s) to optimize:\n`)
  
  let totalOriginal = 0
  let totalOptimized = 0
  
  for (const file of svgFiles) {
    const relativePath = file.replace(PUBLIC_DIR, '')
    console.log(`  Optimizing: ${relativePath}`)
    
    const { original, optimized } = optimizeSVGFile(file)
    totalOriginal += original
    totalOptimized += optimized
    
    const savings = ((original - optimized) / original * 100).toFixed(1)
    console.log(`    ${formatSize(original)} → ${formatSize(optimized)} (${savings}% reduction)`)
  }
  
  console.log(`\n✅ Optimization complete!`)
  console.log(`   Total: ${formatSize(totalOriginal)} → ${formatSize(totalOptimized)}`)
  console.log(`   Saved: ${formatSize(totalOriginal - totalOptimized)} (${((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(1)}%)`)
  
  // Generate inline SVG utility
  generateInlineSVGUtility()
}

/**
 * Generate utility for inlining SVGs in components
 */
function generateInlineSVGUtility() {
  const utilityCode = `/**
 * SVG Inline Utility
 * 
 * Utilities for inlining small SVG icons in components.
 * 
 * Usage in Astro components:
 * ---
 * import { inlineSVG } from '@/lib/utils/svg'
 * const checkIcon = inlineSVG('/icons/check.svg')
 * ---
 * <div set:html={checkIcon} />
 * 
 * Or use the provided SVG component:
 * <InlineSVG src="/icons/check.svg" class="w-5 h-5" />
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Read and inline an SVG file
 * Only use for small icons (<2KB)
 */
export function inlineSVG(path: string): string {
  try {
    const fullPath = join(process.cwd(), 'public', path)
    return readFileSync(fullPath, 'utf-8')
  } catch (error) {
    console.error(\`Failed to inline SVG: \${path}\`, error)
    return ''
  }
}

/**
 * Get SVG as data URI for CSS backgrounds
 */
export function svgDataURI(svgContent: string): string {
  const encoded = encodeURIComponent(svgContent)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')
  return \`data:image/svg+xml,\${encoded}\`
}
`
  
  const utilPath = join(process.cwd(), 'src', 'lib', 'utils', 'svg.ts')
  writeFileSync(utilPath, utilityCode, 'utf-8')
  console.log(`\n✅ SVG utility generated: ${utilPath}`)
}

// Run the script
main()

