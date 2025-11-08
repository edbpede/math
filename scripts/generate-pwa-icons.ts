/**
 * Generate PWA Icons Script
 * 
 * Converts the base SVG favicon into PNG icons at multiple sizes
 * for PWA manifest, iOS, and other platforms.
 * 
 * Sizes generated:
 * - Standard icons: 72, 96, 128, 144, 152, 192, 384, 512
 * - Maskable icons: 192, 512 (with safe zone)
 * - Apple touch icon: 180
 * 
 * Requirements: sharp package for image processing
 * Usage: bun run scripts/generate-pwa-icons.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Icon sizes to generate
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const MASKABLE_SIZES = [192, 512]
const APPLE_TOUCH_ICON_SIZE = 180

// Paths
const SOURCE_SVG = join(process.cwd(), 'public', 'favicon.svg')
const ICONS_DIR = join(process.cwd(), 'public', 'icons')
const BASE_SVG_OUTPUT = join(ICONS_DIR, 'icon-base.svg')

// Ensure icons directory exists
try {
  mkdirSync(ICONS_DIR, { recursive: true })
  console.log('✓ Icons directory created/verified')
} catch (error) {
  console.error('Error creating icons directory:', error)
  process.exit(1)
}

/**
 * Copy base SVG
 */
function copyBaseSVG() {
  try {
    const svgContent = readFileSync(SOURCE_SVG, 'utf-8')
    writeFileSync(BASE_SVG_OUTPUT, svgContent)
    console.log('✓ Copied base SVG to icons directory')
  } catch (error) {
    console.error('Error copying base SVG:', error)
    throw error
  }
}

/**
 * Create a simple PNG icon from SVG data
 * This is a placeholder - in production, use sharp or similar
 */
async function generateIconsWithSharp() {
  try {
    // Try to import sharp
    const sharp = await import('sharp')
    
    const svgBuffer = readFileSync(SOURCE_SVG)
    
    // Generate standard icons
    for (const size of ICON_SIZES) {
      const outputPath = join(ICONS_DIR, `icon-${size}x${size}.png`)
      await sharp.default(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath)
      console.log(`✓ Generated ${size}x${size} icon`)
    }
    
    // Generate maskable icons (with padding for safe zone)
    for (const size of MASKABLE_SIZES) {
      const outputPath = join(ICONS_DIR, `icon-maskable-${size}x${size}.png`)
      const paddedSize = Math.floor(size * 0.8) // 80% of size for safe zone
      await sharp.default(svgBuffer)
        .resize(paddedSize, paddedSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .extend({
          top: Math.floor((size - paddedSize) / 2),
          bottom: Math.ceil((size - paddedSize) / 2),
          left: Math.floor((size - paddedSize) / 2),
          right: Math.ceil((size - paddedSize) / 2),
          background: { r: 59, g: 130, b: 246, alpha: 1 } // Theme color
        })
        .png()
        .toFile(outputPath)
      console.log(`✓ Generated maskable ${size}x${size} icon`)
    }
    
    // Generate Apple touch icon
    const appleTouchPath = join(ICONS_DIR, 'apple-touch-icon.png')
    await sharp.default(svgBuffer)
      .resize(APPLE_TOUCH_ICON_SIZE, APPLE_TOUCH_ICON_SIZE, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(appleTouchPath)
    console.log(`✓ Generated Apple touch icon`)
    
    return true
  } catch (error) {
    return false
  }
}

/**
 * Fallback: Create simple SVG-based icons
 * This wraps the SVG in a simple format for each size
 */
function generateFallbackIcons() {
  console.log('⚠ Sharp not available, generating SVG fallback icons')
  console.log('⚠ For production, install sharp: bun add -d sharp')
  
  const svgContent = readFileSync(SOURCE_SVG, 'utf-8')
  
  // Create SVG-based "icons" by copying the SVG with different names
  // In practice, these will work but PNG is preferred
  const allSizes = [...ICON_SIZES, ...MASKABLE_SIZES, APPLE_TOUCH_ICON_SIZE]
  
  for (const size of allSizes) {
    const filename = allSizes.includes(size) && MASKABLE_SIZES.includes(size) 
      ? `icon-maskable-${size}x${size}.svg`
      : size === APPLE_TOUCH_ICON_SIZE
      ? 'apple-touch-icon.svg'
      : `icon-${size}x${size}.svg`
    
    const outputPath = join(ICONS_DIR, filename)
    
    // Wrap SVG with size attributes
    const wrappedSVG = svgContent.replace(
      '<svg',
      `<svg width="${size}" height="${size}"`
    )
    
    writeFileSync(outputPath, wrappedSVG)
    console.log(`✓ Generated SVG fallback: ${filename}`)
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Generating PWA icons...\n')
  
  // Copy base SVG
  copyBaseSVG()
  
  // Try to generate PNGs with sharp
  const sharpSuccess = await generateIconsWithSharp()
  
  if (!sharpSuccess) {
    // Fallback to SVG copies
    generateFallbackIcons()
    console.log('\n⚠️  WARNING: Using SVG fallback icons')
    console.log('   For best results, install sharp: bun add -d sharp')
    console.log('   Then re-run: bun run scripts/generate-pwa-icons.ts')
  }
  
  console.log('\n✅ Icon generation complete!')
  console.log(`   Icons saved to: ${ICONS_DIR}`)
}

// Run the script
main().catch((error) => {
  console.error('❌ Icon generation failed:', error)
  process.exit(1)
})

