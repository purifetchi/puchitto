/**
 * When to perform this MiniAntics script.
 */
export type AnticsOn = "attach" | "click"

/**
 * A MiniAntics script definition.
 */
export interface AnticsDefinition {
    on: AnticsOn,
    script: string
}