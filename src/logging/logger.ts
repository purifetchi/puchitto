import { callLoggingSinks } from "./sink"

/**
 * The log severity.
 */
export type LogSeverity = 'log' | 'warn' | 'error'

/**
 * A logger.
 */
export class Logger {
    /**
     * The group this logger belongs to.
     */
    private _group: string

    /**
     * The subgroup of the logger.
     */
    private _subgroup?: string

    /**
     * The cached computed group.
     */
    private _cachedComputedGroup: string

    /**
     * Constructs a new logger.
     * @param group The group.
     * @param subgroup The subgroup.
     */
    constructor(group: string, subgroup: string | undefined = undefined) {
        this._group = group
        this._subgroup = subgroup

        this._cachedComputedGroup = this._subgroup !== undefined
            ? `${this._group}(${this._subgroup})`
            : this._group
    }

    /**
     * Gets the group of this logger.
     */
    get group(): string {
        return this._cachedComputedGroup
    }

    /**
     * Emits a log message.
     * @param message The message.
     */
    log(message: string): void {
        callLoggingSinks('log', this.group, message)
    }

    /**
     * Emits a warning message.
     * @param message The message.
     */
    warn(message: string): void {
        callLoggingSinks('warn', this.group, message)
    }

    /**
     * Emits an error message or exception, preserving its stack when available.
     * @param message The message or caught value. Non-Error values are converted to strings.
     * @param context Optional context to prepend to the error.
     */
    error(message: unknown, context?: string): void {
        const details = message instanceof Error
            ? message.stack || message.toString()
            : String(message)
        callLoggingSinks('error', this.group, context ? `${context}\n${details}` : details)
    }
}
