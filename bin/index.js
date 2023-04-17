#!/usr/bin/env node
const fs = require("fs")
const path = require("path")
const args = require("args-parser")(process.argv)
const prompts = require("prompts")

const migrationConfigPath = path.resolve(process.cwd(), "directus-migrator.config.mjs")
let currentConfig
const addEnvironment = async () => {
  if (!currentConfig) {
    const config = await import(`file://${migrationConfigPath}`)
    currentConfig = config.default
  }
  const { name, endpoint, accessToken } = await prompts([
    {
      type: "text",
      name: "name",
      message: "What is the name of the environment?",
      validate: (value) => {
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
  console.log("Config updated!")
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

const getEnvironments = async (sourceName, targetName) => {
  const config = args?.config
  const configPath = path.resolve(process.cwd(), config || "directus-migrator.config.mjs")
  const configModule = await import(`file://${configPath}`)
  const configArray = configModule.default
  const sourceConfig = configArray.find((config) => config.name === sourceName)
  const targetConfig = configArray.find((config) => config.name === targetName)
  return [sourceConfig, targetConfig]
}

const migrateSchema = async () => {
  const directusMigrate = await import("../src/schema-migration.mjs")
  try {
    const { source, target } = args
    const force = args?.force

    const [sourceConfig, targetConfig] = await getEnvironments(source, target)
    await directusMigrate.schemaMigrate(sourceConfig, targetConfig, force)
  } catch (e) {
    console.log({ e })
  }
}

const migrateRoles = async () => {
  const directusMigrate = await import("../src/role-migration.mjs")
  try {
    const { source, target } = args
    const force = args?.force
    const [sourceConfig, targetConfig] = await getEnvironments(source, target)
    await directusMigrate.migrate(sourceConfig, targetConfig, force)
  } catch (e) {
    console.log({ e })
  }
}

const migratePermissions = async () => {
  const directusMigrate = await import("../src/permission-migration.mjs")
  try {
    const { source, target } = args
    const force = args?.force
    const [sourceConfig, targetConfig] = await getEnvironments(source, target)
    await directusMigrate.migrate(sourceConfig, targetConfig, force)
  } catch (e) {
    console.log({ e })
  }
}

if (args.init) {
  init()
} else if (args.add) {
  addEnvironment()
} else if (args.roles || args.permissions) {
  ;(async () => {
    if (args.roles) await migrateRoles()
    if (args.permissions) await migratePermissions()
  })()
} else {
  migrateSchema()
}
