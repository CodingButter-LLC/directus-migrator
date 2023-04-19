let DEBUG_LEVEL

const setDebugLevel = ({ debug, verbose }) => {
  DEBUG_LEVEL = verbose ? "verbose" : debug ? "debug" : false
}
const detail = (logMethod, message, ...extra) => {
  if (DEBUG_LEVEL === "debug") {
    logMethod(message)
  } else if (DEBUG_LEVEL === "verbose") {
    //return with timestamp and extra
    logMethod(`${new Date().toISOString()} ${message}
${extra?.join(", ")}`)
  }
}
const log = (message, ...extra) => {
  detail(console.log, message, ...extra)
}
const warn = (message, ...extra) => {
  detail(console.warn, message, ...extra)
}
const error = (message, ...extra) => {
  detail(console.error, message, ...extra)
}
const info = (message, ...extra) => {
  detail(console.info, message, ...extra)
}
const table = (message) => {
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
