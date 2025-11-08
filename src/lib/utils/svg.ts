/**
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
    console.error(`Failed to inline SVG: ${path}`, error)
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
  return `data:image/svg+xml,${encoded}`
}
