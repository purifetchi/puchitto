import type { AnticsDefinition } from "../objects/anticsDefinition";
import { JsonTransform } from "./jsonTransform";

/**
 * A single entity
 */
export interface LevelEntityDefinition {
    id: number,
    name?: string | undefined,
    tag?: string | undefined,
    antics?: AnticsDefinition[] | undefined,
    type: string,
    transform: JsonTransform,
    data: any
}
