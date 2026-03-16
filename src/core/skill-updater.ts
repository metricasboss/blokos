import fs from 'fs-extra'
import path from 'node:path'
import type { ConsumerConfig, RegistryJson } from './types.js'
import { fetchRegistry, fetchSkill } from './registry-fetcher.js'
import { generateSkill } from './skill-generator.js'

/**
 * Update local skill files to only include installed components
 */
export async function updateLocalSkill(
  cwd: string,
  config: ConsumerConfig
): Promise<void> {
  const skillsDir = path.join(cwd, '.claude', 'skills')
  await fs.ensureDir(skillsDir)

  const installedNames = new Set(
    Object.keys(config.installed || {})
  )

  for (const reg of config.registries) {
    try {
      const registry = await fetchRegistry(reg.url, reg.token)

      // Filter registry to only installed components from this registry
      const filteredRegistry: RegistryJson = {
        ...registry,
        components: {},
      }

      for (const [name, comp] of Object.entries(registry.components)) {
        if (installedNames.has(name)) {
          filteredRegistry.components[name] = comp
        }
      }

      if (Object.keys(filteredRegistry.components).length === 0) continue

      // Try fetching overrides from registry skill, or generate fresh
      let skillContent: string

      if (registry.skill) {
        try {
          const fullSkill = await fetchSkill(reg.url, registry.skill, reg.token)
          skillContent = fullSkill
        } catch {
          skillContent = generateSkill(filteredRegistry)
        }
      } else {
        skillContent = generateSkill(filteredRegistry)
      }

      const skillFileName = `blokos-${reg.name.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.md`
      await fs.writeFile(path.join(skillsDir, skillFileName), skillContent)
    } catch (err) {
      console.warn(`  Warning: could not update skill for ${reg.name}: ${err}`)
    }
  }
}
