import { format, Logger } from "winston";
declare const printf: typeof format.printf;
export declare const levels: {
    error: number;
    warn: number;
    info: number;
    http: number;
    verbose: number;
    debug: number;
};
export declare class LogConfig {
    private _label;
    logger: Logger;
    private _format;
    errorLogFile: string | undefined;
    infoLogFile: string | undefined;
    constructor();
    setLogger(_logger: Logger): void;
    createLogger(): Logger;
    set format(fm: typeof printf);
    get format(): typeof printf;
    get label(): string;
    set label(deviceLabel: string);
}
declare const logger: Logger;
export default logger;
