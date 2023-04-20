const commandLineArgs = require("command-line-args")
const commandLineUsage = require("command-line-usage")
const prompts = require("prompts")
const figlet = require("figlet")
const fs = require("fs")
const path = require("path")
const { DirectusMigrator } = require("../dist/index.js")
const { argv } = process

const optionDefinitions = [
  {
    name: "init",
    type: Boolean,
    alias: "i",
    description: "Initialize the config",
    optional: true,
  },
  {
    name: "add",
    type: Boolean,
    alias: "a",
    description: "Add an environment to the config",
    optional: true,
  },
  {
    name: "force",
    type: Boolean,
    alias: "f",
    description: "Force the migration",
    optional: true,
  },
  {
    name: "source",
    type: String,
    alias: "s",
    description: "The source environment",
    optional: true,
  },
  {
    name: "target",
    type: String,
    alias: "t",
    description: "The target environment",
    optional: true,
  },
  {
    name: "debug",
    type: Boolean,
    alias: "d",
    description: "Enable debug mode",
    optional: true,
  },
  {
    name: "verbose",
    type: Boolean,
    alias: "v",
    description: "Enable verbose mode",
    optional: true,
  },
  {
    name: "help",
    type: Boolean,
    alias: "h",
    description: "Show help",
    optional: true,
  },
  {
    name: "roles",
    type: Boolean,
    alias: "r",
    description: "Migrate roles",
    optional: true,
  },
  {
    name: "permissions",
    type: Boolean,
    alias: "p",
    description: "Migrate permissions",
    optional: true,
  },
  {
    name: "schema",
    type: Boolean,
    alias: "c",
    description: "Migrate schema",
    optional: true,
  },
]

const usage = commandLineUsage([
  {
    header: figlet.textSync("Migrator", {
      horizontalLayout: "full",
      verticalLayout: "small",
      font: "ANSI Shadow",
    }),
    content: "Thanks for using Directus Migrator!",
  },
  {
    header: "Options",
    optionList: optionDefinitions,
  },
  {
    header: "Additional info",
    content: "For more information, visit https://github.com/codingbutter-llc/directus-migrator",
  },
])
const args = commandLineArgs(optionDefinitions, { helpArg: "help", partial: true, argv })

const migrationConfigPath = path.resolve(process.cwd(), "directus-migrator.config.js")
let currentConfig = fs.existsSync(migrationConfigPath) ? require(migrationConfigPath) : []

const addEnvironment = async () => {
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
  const sourceConfig = currentConfig.find((config) => config.name === sourceName)
  const targetConfig = currentConfig.find((config) => config.name === targetName)
  return [sourceConfig, targetConfig]
}

;(async () => {
  if (args?.init) return init()
  if (args?.add) return await addEnvironment()
  if (args?.help) return console.log(usage)
  else {
    if (currentConfig.length) {
      const [sourceConfig, targetConfig] = await getEnvironments(args.source, args.target)
      await DirectusMigrator(sourceConfig, targetConfig, args)
    }
  }
})()
