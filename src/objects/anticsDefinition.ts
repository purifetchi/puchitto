/**
 * When to perform this MiniAntics script.
 */
export type AnticsOn = "attach" | "click" | "rpc"

/**
 * A MiniAntics script definition.
 */
export interface AnticsDefinition {
    on: AnticsOn,
    name?: string,
    script: string
}
