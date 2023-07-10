const commandLineArgs = require("command-line-args")
const commandLineUsage = require("command-line-usage")
const figlet = require("figlet")

process.env.LOGGING_LEVEL = process.env.LOGGING_LEVL || "info"
const optionDefinitions = [
  {
    name: "init",
    type: Boolean,
    alias: "i",
    description: "Initialize the config",
    default: false,
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
    description: "Migrate roles only",
    optional: true,
  },
  {
    name: "permissions",
    type: Boolean,
    alias: "p",
    description: "Migrate permissions only",
    optional: true,
  },
  {
    name: "schema",
    type: Boolean,
    alias: "c",
    description: "Migrate schema only",
    optional: true,
  },
  {
    name: "flows",
    type: Boolean,
    alias: "l",
    description: "Migrate flows only",
    optional: true,
  }
]

const usage = commandLineUsage([
  {
    header: "Codingbutter LLC",
    raw: true,
    content: figlet.textSync("Directus\n  Migrator", {
      horizontalLayout: "default",
      verticalLayout: "fitted",
      width: 120,
      font: "ANSI Shadow",
      whitespaceBreak: true,
    }),
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

const args = commandLineArgs(optionDefinitions, {
  helpArg: "help",
  partial: true,
})

module.exports = { args, usage }
