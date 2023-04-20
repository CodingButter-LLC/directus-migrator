import { DirectusMigratorCommand } from "../types/types"

enum LogLevel {
  DEBUG = "debug",
  VERBOSE = "verbose",
  ERROR = "error",
  WARN = "warn",
  LOG = "log",
  INFO = "info",
}

let DEBUG_LEVEL: LogLevel

//stringify if data is an array or object
//otherwise just return the data
const recusriveJson = (obj: any) => {
  if (typeof obj == "object" && obj != null && !Array.isArray(obj)) {
    Object.keys(obj).forEach((key) => {
      obj[key] = recusriveJson(obj[key])
    })
  } else if (Array.isArray(obj)) {
    obj = obj.map((item: any) => recusriveJson(item))
  } else {
    return JSON.stringify({ obj })
  }
}

const setDebugLevel = function ({ debug, verbose }: Partial<DirectusMigratorCommand>) {}
const detail = (logMethod: (...data: any[]) => void, message: any, ...extra: any[]) => {
  if (DEBUG_LEVEL == "debug") {
    logMethod(message)
  } else if (DEBUG_LEVEL == "verbose") {
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
  detail(console.error, `Error:  ${message}`, ...extra)
  if (DEBUG_LEVEL == "debug") process.exit(1)
}
const info = function (message: any, ...extra: any[]) {
  detail(console.info, message, ...extra)
}
const table = function (message: any) {
  if (DEBUG_LEVEL == "verbose") {
    console.table(recusriveJson(message))
  }
}

export default {
  LEVELS: LogLevel,
  setDebugLevel,
  log,
  warn,
  error,
  info,
  table,
}
