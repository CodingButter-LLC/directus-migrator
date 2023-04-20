import { DirectusMigratorCommand } from "../"

let DEBUG_LEVEL: "debug" | "verbose" | false = "debug"

const setDebugLevel = function ({ debug, verbose }: DirectusMigratorCommand) {
  DEBUG_LEVEL = verbose ? "verbose" : debug ? "debug" : false
}
const detail = (logMethod: (...data: any[]) => void, message: any, ...extra: any[]) => {
  if (DEBUG_LEVEL === "debug") {
    logMethod(message)
  } else if (DEBUG_LEVEL === "verbose") {
    //return with timestamp and extra
    logMethod(`${new Date().toISOString()} ${message}
${extra?.join(", ")}`)
  }
}
const log = function (message: any, ...extra: any[]) {
  detail(console.log, message, ...extra)
}
const warn = function (message: any, ...extra: any[]) {
  detail(console.warn, message, ...extra)
}
const error = function (message: any, ...extra: any[]) {
  detail(console.error, message, ...extra)
}
const info = function (message: any, ...extra: any[]) {
  detail(console.info, message, ...extra)
}
const table = function (message: any) {
  if (DEBUG_LEVEL === "verbose") console.table(message)
}

export default {
  setDebugLevel,
  log,
  warn,
  error,
  info,
  table,
}
