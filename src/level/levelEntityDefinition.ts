import type { AnticsDefinition } from "../objects/anticsDefinition.js";
import type JsonTransform from "./jsonTransform.js";

/**
 * A single entity
 */
export default interface LevelEntityDefinition {
    id?: string | undefined,
    tag?: string | undefined,
    antics?: AnticsDefinition[] | undefined,
    type: string,
    transform: JsonTransform,
    data: any
}