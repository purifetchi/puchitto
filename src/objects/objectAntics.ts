import type MiniAnticsScript from "../scripting/miniAnticsScript.js";
import type { AnticsOn } from "./anticsDefinition.js";

/**
 * The antics for an object.
 */
export default interface ObjectAntics {
    /**
     * When to perform the antics script.
     */
    on: AnticsOn,

    /**
     * The actual script.
     */
    script: MiniAnticsScript
}