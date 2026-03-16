import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import prompts from 'prompts'
import fs from 'fs-extra'
import path from 'node:path'
import {
  CONFIG_FILE,
  REGISTRY_FILE,
  COMPONENTS_DIR,
  SKILL_DIR,
} from '../core/constants.js'

export const initCommand = new Command('init')
  .description('Initialize a new component registry')
  .option('-n, --name <name>', 'Registry name')
  .option('-d, --description <desc>', 'Registry description')
  .option('-y, --yes', 'Skip prompts, use defaults')
  .action(async (options) => {
    const cwd = process.cwd()

    if (await fs.pathExists(path.join(cwd, CONFIG_FILE))) {
      console.log(chalk.yellow('Registry already initialized in this directory.'))
      return
    }

    let name = options.name || path.basename(cwd)
    let description = options.description || ''

    if (!options.yes) {
      const answers = await prompts([
        {
          type: 'text',
          name: 'name',
          message: 'Registry name',
          initial: name,
        },
        {
          type: 'text',
          name: 'description',
          message: 'Description',
          initial: description,
        },
      ])
      name = answers.name || name
      description = answers.description || description
    }

    const spinner = ora('Initializing registry...').start()

    // Create directories
    await fs.ensureDir(path.join(cwd, COMPONENTS_DIR))
    await fs.ensureDir(path.join(cwd, SKILL_DIR))

    // Create blokos.config.ts
    const configContent = `import type { BlokosConfig } from 'blokos'

const config: BlokosConfig = {
  name: '${name}',
  description: '${description}',
  framework: 'react',
}

export default config
`
    await fs.writeFile(path.join(cwd, CONFIG_FILE), configContent)

    // Create empty registry.json
    const registry = {
      name,
      version: '1.0.0',
      description,
      framework: 'react',
      components: {},
    }
    await fs.writeJson(path.join(cwd, REGISTRY_FILE), registry, { spaces: 2 })

    spinner.succeed('Registry initialized!')

    console.log('')
    console.log(`  ${chalk.green(CONFIG_FILE)} — registry config`)
    console.log(`  ${chalk.green(REGISTRY_FILE)} — component index`)
    console.log(`  ${chalk.green(COMPONENTS_DIR + '/')} — your components`)
    console.log(`  ${chalk.green(SKILL_DIR + '/')} — generated AI skills`)
    console.log('')
    console.log(`Next: ${chalk.cyan('blokos create <component-name>')}`)
  })
