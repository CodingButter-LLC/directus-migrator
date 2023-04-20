#!/usr/bin/env node
import { Environment, Role } from "./types/types"
import { SchemaMigrator, PermissionMigrator, RoleMigrator } from "./migrators"
import fs from "fs"
import path from "path"
import { parse } from "ts-command-line-args"
import prompts from "prompts"
import figlet from "figlet"
import logger from "./utils/Logger"

export interface DirectusMigratorCommand {
  init?: boolean
  add?: boolean
  force?: boolean
  source?: string
  target?: string
  debug?: boolean
  verbose?: boolean
  roles?: boolean
  permissions?: boolean
  schema?: boolean
  help?: boolean
}

const args = parse<DirectusMigratorCommand>(
  {
    init: { type: Boolean, alias: "i", description: "Initialize the config", optional: true },
    add: {
      type: Boolean,
      alias: "a",
      description: "Add an environment to the config",
      optional: true,
    },
    force: { type: Boolean, alias: "f", description: "Force the migration", optional: true },
    source: { type: String, alias: "s", description: "The source environment", optional: true },
    target: { type: String, alias: "t", description: "The target environment", optional: true },
    debug: { type: Boolean, alias: "d", description: "Enable debug mode", optional: true },
    verbose: { type: Boolean, alias: "v", description: "Enable verbose mode", optional: true },
    help: { type: Boolean, alias: "h", description: "Show help", optional: true },
    roles: { type: Boolean, alias: "r", description: "Migrate roles", optional: true },
    permissions: { type: Boolean, alias: "p", description: "Migrate permissions", optional: true },
    schema: { type: Boolean, alias: "c", description: "Migrate schema", optional: true },
  },
  {
    helpArg: "help",
    headerContentSections: [
      {
        header: figlet.textSync("Directus Migrator", { horizontalLayout: "full" }),
        content: "Thanks for using Directus Migrator!",
      },
    ],
    footerContentSections: [
      {
        content:
          "For more information, visit https://github.com/codingbutter-llc/directus-migrator",
        header: "Additional info",
      },
    ],
  }
)

logger.setDebugLevel(args)

const migrationConfigPath = path.resolve(process.cwd(), "directus-migrator.config.mjs")
let currentConfig: Environment[] = fs.existsSync(migrationConfigPath)
  ? require(migrationConfigPath).default
  : []

const addEnvironment = async () => {
  const { name, endpoint, accessToken } = await prompts([
    {
      type: "text",
      name: "name",
      message: "What is the name of the environment?",
      validate: (value: string | null | undefined) => {
        if (currentConfig.find((config) => config.name === value)) {
          return "An environment with this name already exists!"
        }
        if (!value) {
          return "Please enter a name!"
        }
        return true
      },
    },
    {
      type: "text",
      name: "endpoint",
      message: "What is the endpoint of the environment?",
      validate: (value) => {
        if (currentConfig.find((config) => config.endpoint === value)) {
          return "An environment with this endpoint already exists!"
        }
        if (!value) {
          return "Please enter an endpoint!"
        }
        return true
      },
    },
    {
      type: "text",
      name: "accessToken",
      message: "What is the access token of the environment?",
      validate: (value) => {
        if (currentConfig.find((config) => config.accessToken === value)) {
          return "An environment with this access token already exists!"
        }
        if (!value) {
          return "Please enter an access token!"
        }
        return true
      },
    },
  ])
  currentConfig = [...currentConfig, { name, endpoint, accessToken }]
  fs.writeFileSync(
    migrationConfigPath,
    `const config = ${JSON.stringify(currentConfig, null, 2)}
 export default config`
  )
  logger.log("Config updated!")
  await addEnvQuestion()
}

const addEnvQuestion = async () => {
  const addEnvResponse = await prompts({
    type: "confirm",
    name: "value",
    message: "Do you want to add an environment to the config?",
    initial: false,
  })
  if (addEnvResponse.value) {
    await addEnvironment()
  } else {
    console.log("Exiting...")
    process.exit(0)
  }
}

const init = async () => {
  if (fs.existsSync(migrationConfigPath)) {
    const overwriteConfig = await prompts({
      type: "confirm",
      name: "value",
      message: "directus-migrator.config.mjs already exists. Do you want to overwrite it?",
      initial: false,
    })
    if (!overwriteConfig.value) {
      console.log("Exiting...")
      process.exit(0)
    }
  }
  fs.writeFileSync(
    migrationConfigPath,
    `const config = [];
export default config`
  )
  await addEnvQuestion()
}

const getEnvironments = async (sourceName?: string, targetName?: string) => {
  const sourceConfig = currentConfig.find((config) => config.name === sourceName)
  const targetConfig = currentConfig.find((config) => config.name === targetName)
  return [sourceConfig, targetConfig] as Environment[]
}

const migrateSchema = async () => {
  try {
    const { source, target } = args
    const force = args?.force

    const [sourceConfig, targetConfig] = await getEnvironments(source, target)
    await SchemaMigrator(args, sourceConfig, targetConfig, force)
  } catch (e) {
    logger.error("Error while migrating schema", { error: e })
  }
}

const migrateRoles = async () => {
  const { source, target } = args
  const force = args?.force
  const [sourceConfig, targetConfig] = await getEnvironments(source, target)
  return await RoleMigrator(args, sourceConfig, targetConfig, force)
}

const migratePermissions = async (mergedRoles: Partial<Role>[]) => {
  const { source, target } = args
  const force = args?.force
  const [sourceEnv, targetEnv] = await getEnvironments(source, target)
  await PermissionMigrator(args, sourceEnv, targetEnv, mergedRoles)
}
;(async () => {
  console.log(figlet.textSync("Directus Migrator", { horizontalLayout: "full" }))
  let mergedRoles: Partial<Role>[] = []
  if (args?.init) return init()
  if (args?.add) return await addEnvironment()
  else {
    if (args?.roles || args?.permissions || args?.schema) {
      if (args.schema) return await migrateSchema()
      mergedRoles = (await migrateRoles()) as Partial<Role>[]
      if (args.permissions) return await migratePermissions(mergedRoles)
    } else {
      await migrateSchema()
      mergedRoles = (await migrateRoles()) as Partial<Role>[]
      await migratePermissions(mergedRoles)
    }
  }
  console.log("Completed!")
})()
