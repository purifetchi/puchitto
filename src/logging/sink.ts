import { LogSeverity } from "./logger"
import { JsConsoleSink } from "./sinks/jsConsoleSink"

/**
 * The list of active sinks.
 */
let sinks: LoggingSink[] = [new JsConsoleSink()]

/**
 * A logging sink.
 */
export interface LoggingSink {
    /**
     * Called when a log event happens.
     * @param severity The severity.
     * @param group The group.
     * @param message The message.
     */
    onLogEvent: (severity: LogSeverity, group: string, message: string) => void
}

/**
 * Registers a logging sink.
 * @param sink The sink.
 */
export const registerLogSink = (sink: LoggingSink): void => {
    sinks.push(sink)
}

/**
 * Clears all registered logging sinks.
 */
export const clearLogSinks = (): void => {
    sinks = []
}

/**
 * Calls the logging sinks for a message.
 * @param severity The severity.
 * @param group The group.
 * @param message The message.
 */
export const callLoggingSinks = (severity: LogSeverity, group: string, message: string): void => {
    sinks.forEach(sink => {
        sink.onLogEvent(severity, group, message)
    })
}
