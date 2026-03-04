import type Entity from "./levelEntityDefinition.js";
import type LightData from "./lightData.js";

/**
 * The definition for a level.
 */
export default interface Level {
    ambient: LightData,
    ents: Entity[]
}