import path from 'node:path'
import fs from 'fs-extra'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

/**
 * Parse a Zod schema from a .ts file by reading the source and evaluating it.
 * This avoids the dual-instance problem where jiti loads a different Zod.
 */
export async function parseZodSchema(
  schemaFilePath: string
): Promise<Record<string, unknown>> {
  const absolutePath = path.resolve(schemaFilePath)
  const source = await fs.readFile(absolutePath, 'utf-8')

  // Strip import statements and extract the schema definition
  const stripped = source
    .replace(/^import\s+.*$/gm, '')
    .replace(/^export\s+/gm, '')
    .trim()

  // Create a function that evaluates the schema with our Zod instance
  const fn = new Function('z', `${stripped}\n return ${getSchemaVarName(source)};`)
  const schema = fn(z)

  if (!schema || !('_def' in schema)) {
    throw new Error(`No valid Zod schema found in ${schemaFilePath}`)
  }

  const jsonSchema = zodToJsonSchema(schema, {
    target: 'jsonSchema7',
    $refStrategy: 'none',
  })

  return jsonSchema as Record<string, unknown>
}

/**
 * Extract the variable name of the exported schema from source
 */
function getSchemaVarName(source: string): string {
  // Match: export const fooSchema = z.object(...)
  const match = source.match(/(?:export\s+)?const\s+(\w+)\s*=/)
  if (match) return match[1]

  // Fallback: look for any assignment to z.object
  const fallback = source.match(/(\w+)\s*=\s*z\.object/)
  if (fallback) return fallback[1]

  throw new Error('Could not find schema variable name in source')
}
