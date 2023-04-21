import { createLogger, format, transports, Logger } from 'winston'
import { PrettyPrintOptions, TimestampOptions } from 'logform'
import { hostname } from 'os'
import exec from 'child_process'

const ghEmail:string|undefined = exec.execSync('git config --global user.email')?.toString()?.trim()
const deviceLabel:string = ghEmail?.includes('@') ? ghEmail : hostname() || `${process.env.NODE_ENV}`
const { printf, combine, timestamp, label, prettyPrint,colorize } = format

export const levels = {
    error  : 0,
    warn   : 1,
    info   : 2,
    http   : 3,
    verbose: 4,
    debug  : 5
}



const timestampOptions: TimestampOptions = process.env.NODE_ENV === 'development' ?
  {format : 'YYYY-MM-DD HH:mm:ss'} : {format: 'YYYY-MM-DD'}
    


const myFormat = printf(({ level, message, label, timestamp }) => {
  switch (level) {
    case 'error':
      return `${timestamp} [${label}] ${level}: ${message}`
    case 'warn':
      return `${timestamp} [${label}] ${level}: ${message}`
    case 'info':
      return `${timestamp} [${label}] ${level}: ${message}`
    case 'http':
      return `${timestamp} [${label}] ${level}: ${message}`
    case 'verbose':
      return `${level}: ${message}`
    case 'debug':
      return `${level}: ${message}`
    case 'silly':
      return `${message}`
    default:
      return `${message}`
  }
})


export class LogConfig {
  private _label: string
  public logger: Logger
  private _format: typeof printf = printf
  constructor() {
    this._label = deviceLabel || 'unknown'
    this.logger = createLogger({
      levels,
      format: combine(
        colorize(),
        label({ label: this.label }),
        timestamp(timestampOptions),
        myFormat
      ),
      transports: [
        new transports.Console({ level: 'debug' }),
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'info.log', level: 'info' })
      ]
    })
  }

  set format(fm: typeof printf) {
    this._format = fm
  }
  
  get format(): typeof printf {
    return this._format
  }

  get label() {
    return this._label
  }
  set label(deviceLabel: string) {
    this._label = deviceLabel
  }
}

const logger = new LogConfig().logger

export default logger