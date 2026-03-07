import { MiniAnticsScript } from "../scripting";
import type { AnticsOn } from "./anticsDefinition";

/**
 * The antics for an object.
 */
export interface ObjectAntics {
    /**
     * When to perform the antics script.
     */
    on: AnticsOn,

    /**
     * The actual script.
     */
    script: MiniAnticsScript
}
