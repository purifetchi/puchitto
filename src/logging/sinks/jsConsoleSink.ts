import { LogSeverity } from "../logger";
import { LoggingSink } from "../sink";

/**
 * A sink that dispatches all messages to the JS console.
 */
export class JsConsoleSink implements LoggingSink {
    onLogEvent(severity: LogSeverity, group: string, message: string) {
        const msg = `[${group}] ${message}`
        switch (severity) {
            case 'log':
                console.log(msg)
                break

            case 'warn':
                console.warn(msg)
                break

            case 'error':
                console.error(msg)
                break
        }
    }
}
