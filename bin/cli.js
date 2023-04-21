const prompts = require("prompts")
const fs = require("fs")
const path = require("path")
const { DirectusMigrator } = require("../dist/index.js")
const { args, usage } = require("./commands.config.js")

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
