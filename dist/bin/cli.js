#!/usr/bin/env node
const prompts = require("prompts")
const fs = require("fs")
const path = require("path")
const { directusMigrator } = require("../dist/index.js")
const { args, usage } = require("./commands.config.js")
const figlet = require("figlet")
const migrationConfigPath = path.resolve(process.cwd(), "directus-migrator.config.js")
let currentConfig = fs.existsSync(migrationConfigPath) ? require(migrationConfigPath) : {environments: []}

const addEnvironment = async () => {
  const { name, endpoint, accessToken } = await prompts([
    {
      type: "text",
      name: "name",
      message: "What is the name of the environment?",
      validate: (value) => {
        if (currentConfig?.environments.find((config) => config.name === value)) {
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
        if (currentConfig?.environments.find((config) => config.endpoint === value)) {
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
        if (currentConfig?.environments.find((config) => config.accessToken === value)) {
          return "An environment with this access token already exists!"
        }
        if (!value) {
          return "Please enter an access token!"
        }
        return true
      },
    },
  ])
  const updatedConfig = { name, endpoint, accessToken }
  if(!currentConfig?.environments.find(({production})=>production)){
    const isProduction = await prompts({
      type: "confirm",
      name: "value",
      message: "Is this a production environment?",
      initial: false,
    })
    if (isProduction.value) {
      updatedConfig.production = true
    }
  }

  currentConfig = {
    ...currentConfig,
    environments: [...currentConfig.environments, updatedConfig ],
  }
  fs.writeFileSync(
    migrationConfigPath,
    `const config = ${JSON.stringify(currentConfig, null, 4)}
 module.exports = config`
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
    `const config = {environments: []};
module.exports = config`
  )
  currentConfig = {environments: []}
  await addEnvQuestion()
}

const getEnvironments = async (sourceName, targetName) => {
  const sourceConfig = currentConfig?.environments?.find((config) => config.name === sourceName)
  const targetConfig = currentConfig?.environments?.find((config) => config.name === targetName)
  return [sourceConfig, targetConfig]
}

;(async () => {
  if (args?.init) {
    console.log("Initializing config...")
    await init()
    return
  } else if (args?.add) {
    console.log("Adding environment to config...")
    await addEnvironment()
    return
  } else if (args?.help) {
    console.log("Showing help...")
    return console.log(usage)
  } else {
    if (currentConfig?.environments?.length) {
      console.log(
        figlet.textSync("Directus\n  Migrator", {
          horizontalLayout: "default",
          verticalLayout: "fitted",
          width: 120,
          font: "ANSI Shadow",
          whitespaceBreak: true,
        })
      )

      const [sourceConfig, targetConfig] = await getEnvironments(args.source, args.target)
      if (targetConfig?.production) {
        const confirm = await prompts({
          type: "confirm",
          name: "value",
          message: "You are about to migrate to a production environment. Are you sure?",
          initial: false,
        })
        if (!confirm.value) {
          console.log("Exiting...")
          process.exit(0)
        }
      }
      await directusMigrator(sourceConfig, targetConfig, args)
    } else {
      console.log(
        `No environments found. Please run ${"directus-migrator --init"} to initialize the config.`
      )
    }
  }
})()
