import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'node:path'
import { CONFIG_FILE, COMPONENTS_DIR, META_FILE, SCHEMA_FILE } from '../core/constants.js'
import { toPascalCase } from '../utils/helpers.js'

export const createCommand = new Command('create')
  .description('Scaffold a new component')
  .argument('<name>', 'Component name in kebab-case (e.g. hero-section)')
  .action(async (name: string) => {
    const cwd = process.cwd()

    if (!(await fs.pathExists(path.join(cwd, CONFIG_FILE)))) {
      console.log(chalk.red('No blokos registry found. Run `blokos init` first.'))
      process.exit(1)
    }

    const componentDir = path.join(cwd, COMPONENTS_DIR, name)

    if (await fs.pathExists(componentDir)) {
      console.log(chalk.yellow(`Component "${name}" already exists.`))
      return
    }

    const spinner = ora(`Creating ${name}...`).start()

    const pascalName = toPascalCase(name)

    await fs.ensureDir(componentDir)

    // schema.ts
    const schemaContent = `import { z } from 'zod'

export const ${pascalName.charAt(0).toLowerCase() + pascalName.slice(1)}Schema = z.object({
  title: z.string().describe('Main title'),
})
`
    await fs.writeFile(path.join(componentDir, SCHEMA_FILE), schemaContent)

    // component.tsx
    const componentContent = `import { z } from 'zod'
import { ${pascalName.charAt(0).toLowerCase() + pascalName.slice(1)}Schema } from './schema'

type ${pascalName}Props = z.infer<typeof ${pascalName.charAt(0).toLowerCase() + pascalName.slice(1)}Schema>

export function ${pascalName}({ title }: ${pascalName}Props) {
  return (
    <div>
      <h2>{title}</h2>
    </div>
  )
}
`
    await fs.writeFile(path.join(componentDir, `${name}.tsx`), componentContent)

    // meta.json
    const meta = {
      name: pascalName,
      description: `${pascalName} component`,
      category: 'general',
      slots: [],
      dependencies: [],
      examples: [
        {
          description: 'Default',
          props: { title: `Example ${pascalName}` },
        },
      ],
    }
    await fs.writeJson(path.join(componentDir, META_FILE), meta, { spaces: 2 })

    spinner.succeed(`Component ${chalk.cyan(pascalName)} created!`)

    console.log('')
    console.log(`  ${chalk.green(`${COMPONENTS_DIR}/${name}/${name}.tsx`)} — component`)
    console.log(`  ${chalk.green(`${COMPONENTS_DIR}/${name}/${SCHEMA_FILE}`)} — props schema`)
    console.log(`  ${chalk.green(`${COMPONENTS_DIR}/${name}/${META_FILE}`)} — metadata`)
    console.log('')
    console.log(`Edit the files, then run ${chalk.cyan('blokos publish')}`)
  })
