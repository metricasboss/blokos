import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'node:path'
import { CONSUMER_CONFIG } from '../core/constants.js'
import { fetchRegistry } from '../core/registry-fetcher.js'
import type { ConsumerConfig } from '../core/types.js'

export const listCommand = new Command('list')
  .description('List available and installed components')
  .action(async () => {
    const cwd = process.cwd()
    const configPath = path.join(cwd, CONSUMER_CONFIG)

    if (!(await fs.pathExists(configPath))) {
      console.log(chalk.red(`No ${CONSUMER_CONFIG} found. Run \`blokos connect <url>\` first.`))
      process.exit(1)
    }

    const config: ConsumerConfig = await fs.readJson(configPath)

    if (config.registries.length === 0) {
      console.log(chalk.yellow('No registries connected.'))
      return
    }

    const spinner = ora('Fetching registries...').start()

    const installed = new Set(Object.keys(config.installed || {}))

    const rows: Array<{
      name: string
      category: string
      registry: string
      status: string
    }> = []

    for (const reg of config.registries) {
      try {
        const registry = await fetchRegistry(reg.url, reg.token)
        for (const comp of Object.values(registry.components)) {
          rows.push({
            name: comp.name,
            category: comp.category,
            registry: reg.name,
            status: installed.has(comp.name) ? 'installed' : 'available',
          })
        }
      } catch (err) {
        console.warn(`  Warning: could not fetch ${reg.name}: ${err}`)
      }
    }

    spinner.stop()

    if (rows.length === 0) {
      console.log(chalk.yellow('No components found in connected registries.'))
      return
    }

    // Print table
    const nameWidth = Math.max(10, ...rows.map((r) => r.name.length)) + 2
    const catWidth = Math.max(10, ...rows.map((r) => r.category.length)) + 2
    const regWidth = Math.max(10, ...rows.map((r) => r.registry.length)) + 2

    console.log('')
    console.log(
      chalk.bold(
        '  ' +
          'Component'.padEnd(nameWidth) +
          'Category'.padEnd(catWidth) +
          'Registry'.padEnd(regWidth) +
          'Status'
      )
    )
    console.log('  ' + '─'.repeat(nameWidth + catWidth + regWidth + 12))

    for (const row of rows) {
      const statusColor = row.status === 'installed' ? chalk.green : chalk.dim
      console.log(
        '  ' +
          row.name.padEnd(nameWidth) +
          row.category.padEnd(catWidth) +
          row.registry.padEnd(regWidth) +
          statusColor(row.status)
      )
    }

    console.log('')
    console.log(`Run ${chalk.cyan('blokos add <name>')} to install a component.`)
  })
