/* eslint-disable @typescript-eslint/ban-types */
import * as Chalk from 'chalk';

export enum LogLevel {
    TRACE = 10,
    DEBUG = 20,
    INFO = 30,
    WARN = 40,
    ERROR = 50,
    FATAL = 60,
}

export class Logger {
    private static logTemplate = {
        [LogLevel.TRACE]: Chalk.greenBright,
        [LogLevel.DEBUG]: Chalk.whiteBright,
        [LogLevel.INFO]: Chalk.blueBright,
        [LogLevel.WARN]: Chalk.magenta,
        [LogLevel.ERROR]: Chalk.redBright,
        [LogLevel.FATAL]: Chalk.bgRed,
    };

    // Central log method
    private static log(level: LogLevel, data: any, tag?: string) {
        if (Number(process.env.APP_LOG_LEVEL) > level) {
            return;
        }

        let output: string;
        const timestamp = new Date().toISOString();
        const levelStr = LogLevel[level];

        if (typeof data === 'object') {
            const str = JSON.stringify(data, null, 2);
            data = str !== '{}' ? str : String(data);
        }

        output = `[${timestamp}] [${levelStr}]`;

        if (tag) {
            output += ` [${Chalk.bold.white(tag)}]`;
        }

        console.log(output, this.logTemplate[level](data));
    }

    public static Trace(data: any, tag?: string) {
        this.log(LogLevel.TRACE, data, tag);
    }

    public static Debug(data: any, tag?: string) {
        this.log(LogLevel.DEBUG, data, tag);
    }

    public static Info(data: any, tag?: string) {
        this.log(LogLevel.INFO, data, tag);
    }

    public static Warn(data: any, tag?: string) {
        this.log(LogLevel.WARN, data, tag);
    }

    public static Error(data: any, tag?: string) {
        this.log(LogLevel.ERROR, data, tag);
    }

    public static Fatal(data: any, tag?: string) {
        this.log(LogLevel.FATAL, data, tag);
    }

    // Remove this from microservices — only for HTTP apps
    public static GetLoggerMiddleware(): Function | null {
        return null;
    }
}
