var _a, _b, _c, _d;
import { createLogger, format, transports } from "winston";
import { hostname } from "os";
import { execSync } from "child_process";
var printf = format.printf, combine = format.combine, timestamp = format.timestamp, label = format.label, colorize = format.colorize;
var deviceLabel = process.env.DEVICE_LABEL || process.env.NODE_ENV;
try {
    var ghEmail = (_b = (_a = execSync("git config --global user.email")) === null || _a === void 0 ? void 0 : _a.toString()) === null || _b === void 0 ? void 0 : _b.trim();
    var ghUser = (_d = (_c = execSync("git config --global user.name")) === null || _c === void 0 ? void 0 : _c.toString()) === null || _d === void 0 ? void 0 : _d.trim();
    deviceLabel = (ghEmail === null || ghEmail === void 0 ? void 0 : ghEmail.includes("@"))
        ? "git:".concat(ghEmail)
        : ghUser.length
            ? "git:".concat(ghUser)
            : hostname() || deviceLabel;
}
catch (e) {
    // do nothing
}
export var levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
};
var timestampOptions = process.env.NODE_ENV === "development"
    ? { format: "YYYY-MM-DD HH:mm:ss" }
    : { format: "YYYY-MM-DD" };
var myFormat = printf(function (_a) {
    var level = _a.level, message = _a.message, label = _a.label, timestamp = _a.timestamp;
    return "".concat(timestamp, " [").concat(label, "] ").concat(level, ": ").concat(message);
});
var LogConfig = /** @class */ (function () {
    function LogConfig() {
        this._format = printf;
        this.errorLogFile = process.env.ERROR_LOG_FILE;
        this.infoLogFile = process.env.INFO_LOG_FILE;
        this._label = deviceLabel || "unknown";
        this.logger = this.createLogger();
    }
    LogConfig.prototype.setLogger = function (_logger) {
        this.logger = _logger;
    };
    LogConfig.prototype.createLogger = function () {
        var loggerTransports = [
            new transports.Console({ level: process.env.LOG_LEVEL || "info" }),
        ];
        if (this.errorLogFile) {
            loggerTransports.push(new transports.File({ filename: "error.log", level: "error" }));
        }
        if (this.infoLogFile) {
            loggerTransports.push(new transports.File({ filename: "info.log", level: "info" }));
        }
        return createLogger({
            levels: levels,
            format: combine(colorize(), label({ label: this.label }), timestamp(timestampOptions), myFormat),
            transports: loggerTransports,
        });
    };
    Object.defineProperty(LogConfig.prototype, "format", {
        get: function () {
            return this._format;
        },
        set: function (fm) {
            this._format = fm;
            this.logger = this.createLogger();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LogConfig.prototype, "label", {
        get: function () {
            return this._label;
        },
        set: function (deviceLabel) {
            this._label = deviceLabel;
            this.logger = this.createLogger();
        },
        enumerable: false,
        configurable: true
    });
    return LogConfig;
}());
export { LogConfig };
var logger = new LogConfig().logger;
export default logger;
