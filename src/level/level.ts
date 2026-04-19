import { LevelEntityDefinition } from "./levelEntityDefinition";
import { LightData } from "./lightData";

/**
 * The definition for a level.
 */
export interface Level {
    version?: number,
    ambient: LightData,
    ents: LevelEntityDefinition[]
}
