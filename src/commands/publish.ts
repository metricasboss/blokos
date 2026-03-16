import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'node:path'
import { CONFIG_FILE, REGISTRY_FILE, SKILL_DIR, SKILL_FILE, SKILL_OVERRIDES_FILE } from '../core/constants.js'
import { buildRegistry } from '../core/registry-builder.js'
import { generateSkill, loadSkillOverrides } from '../core/skill-generator.js'

export const publishCommand = new Command('publish')
  .description('Build registry.json and generate AI skill from components')
  .action(async () => {
    const cwd = process.cwd()

    if (!(await fs.pathExists(path.join(cwd, CONFIG_FILE)))) {
      console.log(chalk.red('No blokos registry found. Run `blokos init` first.'))
      process.exit(1)
    }

    const spinner = ora('Building registry...').start()

    const registry = await buildRegistry(cwd)
    const componentCount = Object.keys(registry.components).length

    // Write registry.json
    await fs.writeJson(path.join(cwd, REGISTRY_FILE), registry, { spaces: 2 })
    spinner.text = 'Generating skill...'

    // Generate skill
    const overrides = await loadSkillOverrides(path.join(cwd, SKILL_OVERRIDES_FILE))
    const skill = generateSkill(registry, overrides)

    await fs.ensureDir(path.join(cwd, SKILL_DIR))
    await fs.writeFile(path.join(cwd, SKILL_DIR, SKILL_FILE), skill)

    // Update registry with skill path
    registry.skill = `${SKILL_DIR}/${SKILL_FILE}`
    await fs.writeJson(path.join(cwd, REGISTRY_FILE), registry, { spaces: 2 })

    spinner.succeed('Published!')

    console.log('')
    console.log(`  ${chalk.green(REGISTRY_FILE)} — ${componentCount} component(s)`)
    console.log(`  ${chalk.green(`${SKILL_DIR}/${SKILL_FILE}`)} — AI skill`)
    console.log('')
    console.log(`Commit and push to make it available to consumers.`)
  })
