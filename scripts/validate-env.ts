#!/usr/bin/env bun
/**
 * Environment Variable Validation Script
 *
 * Validates that all required environment variables are set before build.
 * Ensures proper configuration for production deployments.
 *
 * Requirements: 18.1 - Add environment variable configuration
 *
 * Usage:
 * - Development: bun run scripts/validate-env.ts
 * - CI/CD: Add to build pipeline before `bun run build`
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'

interface EnvVariable {
  name: string
  required: boolean
  description: string
  example?: string
  validation?: (value: string) => boolean
  validationError?: string
}

/**
 * Environment variable definitions
 */
const ENV_VARIABLES: EnvVariable[] = [
  {
    name: 'PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    example: 'https://your-project-ref.supabase.co',
    validation: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
    validationError: 'Must be a valid Supabase URL (https://xxx.supabase.co)',
  },
  {
    name: 'PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous/public API key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    validation: (value) => value.startsWith('eyJ') && value.length > 100,
    validationError: 'Must be a valid Supabase anon key (JWT token)',
  },
  {
    name: 'NODE_ENV',
    required: false,
    description: 'Node environment (development, production, test)',
    example: 'production',
    validation: (value) => ['development', 'production', 'test'].includes(value),
    validationError: 'Must be one of: development, production, test',
  },
]

/**
 * Color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

/**
 * Check if .env file exists
 */
function checkEnvFile(): boolean {
  const envPath = join(process.cwd(), '.env')

  if (!existsSync(envPath)) {
    console.error(`${colors.red}❌ Error: .env file not found${colors.reset}`)
    console.log(`\n${colors.yellow}To fix this:${colors.reset}`)
    console.log(`  1. Copy .env.example to .env:`)
    console.log(`     ${colors.cyan}cp .env.example .env${colors.reset}`)
    console.log(`  2. Fill in your Supabase credentials`)
    console.log(`  3. Get credentials from: https://app.supabase.com\n`)
    return false
  }

  return true
}

/**
 * Validate a single environment variable
 */
function validateEnvVar(envVar: EnvVariable): { valid: boolean; message?: string } {
  const value = process.env[envVar.name]

  // Check if required variable is missing
  if (envVar.required && !value) {
    return {
      valid: false,
      message: `${colors.red}✗${colors.reset} ${envVar.name} - ${colors.red}MISSING (required)${colors.reset}\n  ${envVar.description}\n  Example: ${envVar.example || 'N/A'}`,
    }
  }

  // Skip validation if optional and not set
  if (!envVar.required && !value) {
    return {
      valid: true,
      message: `${colors.yellow}○${colors.reset} ${envVar.name} - ${colors.yellow}Not set (optional)${colors.reset}`,
    }
  }

  // Run custom validation if provided
  if (value && envVar.validation && !envVar.validation(value)) {
    return {
      valid: false,
      message: `${colors.red}✗${colors.reset} ${envVar.name} - ${colors.red}INVALID${colors.reset}\n  ${envVar.validationError || 'Validation failed'}\n  Current: ${value.substring(0, 50)}...`,
    }
  }

  // Variable is valid
  const displayValue = value!.length > 50 ? `${value!.substring(0, 50)}...` : value
  return {
    valid: true,
    message: `${colors.green}✓${colors.reset} ${envVar.name} - ${colors.green}OK${colors.reset}\n  ${displayValue}`,
  }
}

/**
 * Main validation function
 */
function validateEnvironment(): boolean {
  console.log(`${colors.blue}🔍 Validating environment variables...${colors.reset}\n`)

  // Check if .env file exists
  if (!checkEnvFile()) {
    return false
  }

  let allValid = true
  const results: string[] = []

  // Validate each environment variable
  for (const envVar of ENV_VARIABLES) {
    const result = validateEnvVar(envVar)
    results.push(result.message || '')

    if (!result.valid) {
      allValid = false
    }
  }

  // Print results
  console.log(results.join('\n\n'))
  console.log('')

  // Print summary
  if (allValid) {
    console.log(`${colors.green}✅ All environment variables are valid!${colors.reset}\n`)
    return true
  } else {
    console.log(`${colors.red}❌ Environment validation failed${colors.reset}`)
    console.log(`${colors.yellow}Please fix the errors above before building${colors.reset}\n`)
    return false
  }
}

// Run validation
const isValid = validateEnvironment()
process.exit(isValid ? 0 : 1)

