#!/usr/bin/env node
/**
 * Translation Validation Script
 *
 * Validates translation files for:
 * - JSON format correctness
 * - Placeholder consistency between source and target languages
 * - Key completeness (all source keys exist in target languages)
 * - Format correctness (no trailing spaces, proper structure)
 *
 * This script is run during the build process to ensure translation quality.
 * It's also used by Weblate to validate translations before they're committed.
 *
 * Usage:
 *   bun run validate-translations
 *   bun run validate-translations --locale=en-US
 *   bun run validate-translations --component=common
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation errors found
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get script directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales')
const SOURCE_LOCALE = 'da-DK'

// Supported locales (add more as they're added)
const TARGET_LOCALES = ['en-US']

// Translation components (file names without .json extension)
const COMPONENTS = [
	'common',
	'auth',
	'navigation',
	'competencies',
	'exercises',
	'feedback',
	'hints',
	'contexts',
	'errors',
]

// ANSI color codes for terminal output
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
}

// Error tracking
interface ValidationError {
	locale: string
	component: string
	key: string
	message: string
	severity: 'error' | 'warning'
}

const errors: ValidationError[] = []

/**
 * Parse command line arguments
 */
function parseArgs(): { locale?: string; component?: string } {
	const args = process.argv.slice(2)
	const result: { locale?: string; component?: string } = {}

	for (const arg of args) {
		if (arg.startsWith('--locale=')) {
			result.locale = arg.split('=')[1]
		} else if (arg.startsWith('--component=')) {
			result.component = arg.split('=')[1]
		}
	}

	return result
}

/**
 * Log a message with color
 */
function log(message: string, color?: keyof typeof colors) {
	const colorCode = color ? colors[color] : ''
	console.log(`${colorCode}${message}${colors.reset}`)
}

/**
 * Log an error
 */
function logError(error: ValidationError) {
	errors.push(error)

	const severity = error.severity === 'error' ? '❌ ERROR' : '⚠️  WARNING'
	const color = error.severity === 'error' ? 'red' : 'yellow'

	log(`${severity}: [${error.locale}/${error.component}] ${error.key}`, color)
	log(`  ${error.message}`, color)
}

/**
 * Load JSON file safely
 */
function loadJSON(filePath: string): Record<string, any> | null {
	try {
		const content = fs.readFileSync(filePath, 'utf-8')
		return JSON.parse(content)
	} catch (error) {
		return null
	}
}

/**
 * Extract all keys from a nested object with dot notation
 */
function extractKeys(
	obj: Record<string, any>,
	prefix = '',
): Map<string, string> {
	const keys = new Map<string, string>()

	for (const [key, value] of Object.entries(obj)) {
		const fullKey = prefix ? `${prefix}.${key}` : key

		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			// Recursively extract keys from nested objects
			const nestedKeys = extractKeys(value, fullKey)
			for (const [nestedKey, nestedValue] of nestedKeys) {
				keys.set(nestedKey, nestedValue)
			}
		} else if (typeof value === 'string') {
			keys.set(fullKey, value)
		} else if (Array.isArray(value)) {
			// Store arrays as JSON strings for comparison
			keys.set(fullKey, JSON.stringify(value))
		}
	}

	return keys
}

/**
 * Extract placeholders from a string
 */
function extractPlaceholders(text: string): Set<string> {
	const placeholders = new Set<string>()
	const regex = /\{\{(\w+)\}\}/g
	let match

	while ((match = regex.exec(text)) !== null) {
		placeholders.add(match[1])
	}

	return placeholders
}

/**
 * Validate JSON format
 */
function validateJSONFormat(
	locale: string,
	component: string,
	filePath: string,
): boolean {
	const content = loadJSON(filePath)

	if (content === null) {
		logError({
			locale,
			component,
			key: '<file>',
			message: `Invalid JSON format. Cannot parse file: ${filePath}`,
			severity: 'error',
		})
		return false
	}

	return true
}

/**
 * Validate key completeness
 */
function validateKeyCompleteness(
	sourceKeys: Map<string, string>,
	targetKeys: Map<string, string>,
	locale: string,
	component: string,
): void {
	// Check for missing keys
	for (const [sourceKey] of sourceKeys) {
		if (!targetKeys.has(sourceKey)) {
			logError({
				locale,
				component,
				key: sourceKey,
				message: `Missing translation key (exists in ${SOURCE_LOCALE} but not in ${locale})`,
				severity: 'error',
			})
		}
	}

	// Check for extra keys (warn only)
	for (const [targetKey] of targetKeys) {
		if (!sourceKeys.has(targetKey)) {
			logError({
				locale,
				component,
				key: targetKey,
				message: `Extra translation key (exists in ${locale} but not in ${SOURCE_LOCALE})`,
				severity: 'warning',
			})
		}
	}
}

/**
 * Validate placeholder consistency
 */
function validatePlaceholders(
	sourceKeys: Map<string, string>,
	targetKeys: Map<string, string>,
	locale: string,
	component: string,
): void {
	for (const [key, sourceValue] of sourceKeys) {
		const targetValue = targetKeys.get(key)

		if (!targetValue) {
			// Missing key - already reported in key completeness check
			continue
		}

		// Skip non-string values
		if (
			sourceValue.startsWith('[') ||
			sourceValue.startsWith('{') ||
			targetValue.startsWith('[') ||
			targetValue.startsWith('{')
		) {
			continue
		}

		const sourcePlaceholders = extractPlaceholders(sourceValue)
		const targetPlaceholders = extractPlaceholders(targetValue)

		// Check if all source placeholders exist in target
		for (const placeholder of sourcePlaceholders) {
			if (!targetPlaceholders.has(placeholder)) {
				logError({
					locale,
					component,
					key,
					message: `Missing placeholder: {{${placeholder}}} (present in ${SOURCE_LOCALE}: "${sourceValue}")`,
					severity: 'error',
				})
			}
		}

		// Check if target has extra placeholders
		for (const placeholder of targetPlaceholders) {
			if (!sourcePlaceholders.has(placeholder)) {
				logError({
					locale,
					component,
					key,
					message: `Extra placeholder: {{${placeholder}}} (not present in ${SOURCE_LOCALE}: "${sourceValue}")`,
					severity: 'error',
				})
			}
		}
	}
}

/**
 * Validate format consistency
 */
function validateFormat(
	targetKeys: Map<string, string>,
	locale: string,
	component: string,
): void {
	for (const [key, value] of targetKeys) {
		// Skip non-string values
		if (value.startsWith('[') || value.startsWith('{')) {
			continue
		}

		// Check for trailing/leading spaces
		if (value !== value.trim()) {
			logError({
				locale,
				component,
				key,
				message: `Translation has trailing or leading whitespace: "${value}"`,
				severity: 'warning',
			})
		}

		// Check for empty strings
		if (value.trim() === '') {
			logError({
				locale,
				component,
				key,
				message: 'Translation is empty',
				severity: 'error',
			})
		}
	}
}

/**
 * Validate a single component for a locale
 */
function validateComponent(locale: string, component: string): void {
	log(`\n  Validating ${component}.json...`, 'cyan')

	const sourceFile = path.join(LOCALES_DIR, SOURCE_LOCALE, `${component}.json`)
	const targetFile = path.join(LOCALES_DIR, locale, `${component}.json`)

	// Check if files exist
	if (!fs.existsSync(sourceFile)) {
		logError({
			locale: SOURCE_LOCALE,
			component,
			key: '<file>',
			message: `Source file not found: ${sourceFile}`,
			severity: 'error',
		})
		return
	}

	if (!fs.existsSync(targetFile)) {
		logError({
			locale,
			component,
			key: '<file>',
			message: `Target file not found: ${targetFile}`,
			severity: 'error',
		})
		return
	}

	// Validate JSON format
	if (
		!validateJSONFormat(SOURCE_LOCALE, component, sourceFile) ||
		!validateJSONFormat(locale, component, targetFile)
	) {
		return
	}

	// Load JSON files
	const sourceJSON = loadJSON(sourceFile)
	const targetJSON = loadJSON(targetFile)

	if (!sourceJSON || !targetJSON) {
		return
	}

	// Extract keys
	const sourceKeys = extractKeys(sourceJSON)
	const targetKeys = extractKeys(targetJSON)

	// Run validations
	validateKeyCompleteness(sourceKeys, targetKeys, locale, component)
	validatePlaceholders(sourceKeys, targetKeys, locale, component)
	validateFormat(targetKeys, locale, component)
}

/**
 * Validate all components for a locale
 */
function validateLocale(locale: string, componentFilter?: string): void {
	log(`\nValidating ${locale}...`, 'blue')

	const componentsToValidate = componentFilter
		? [componentFilter]
		: COMPONENTS

	for (const component of componentsToValidate) {
		if (!COMPONENTS.includes(component)) {
			log(`  Unknown component: ${component}`, 'yellow')
			continue
		}

		validateComponent(locale, component)
	}
}

/**
 * Print validation summary
 */
function printSummary(): void {
	log('\n' + '='.repeat(60), 'cyan')
	log('Translation Validation Summary', 'cyan')
	log('='.repeat(60), 'cyan')

	const errorCount = errors.filter((e) => e.severity === 'error').length
	const warningCount = errors.filter((e) => e.severity === 'warning').length

	if (errorCount === 0 && warningCount === 0) {
		log('\n✅ All validations passed!', 'green')
		log(`   Checked ${TARGET_LOCALES.length} locale(s) across ${COMPONENTS.length} component(s)\n`, 'green')
	} else {
		if (errorCount > 0) {
			log(`\n❌ Found ${errorCount} error(s)`, 'red')
		}
		if (warningCount > 0) {
			log(`⚠️  Found ${warningCount} warning(s)`, 'yellow')
		}
		log('')
	}
}

/**
 * Main execution
 */
async function main() {
	log('='.repeat(60), 'cyan')
	log('Translation Validation Script', 'cyan')
	log('='.repeat(60), 'cyan')

	const args = parseArgs()

	// Determine which locales to validate
	const localesToValidate = args.locale ? [args.locale] : TARGET_LOCALES

	// Validate each locale
	for (const locale of localesToValidate) {
		if (locale === SOURCE_LOCALE) {
			log(`\nSkipping source locale: ${locale}`, 'yellow')
			continue
		}

		validateLocale(locale, args.component)
	}

	// Print summary
	printSummary()

	// Exit with error code if there are errors
	const errorCount = errors.filter((e) => e.severity === 'error').length
	if (errorCount > 0) {
		process.exit(1)
	}
}

// Run the script
main().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
