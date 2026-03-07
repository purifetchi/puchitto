import { LevelEntityDefinition } from "./levelEntityDefinition";
import { LightData } from "./lightData";

/**
 * The definition for a level.
 */
export interface Level {
    ambient: LightData,
    ents: LevelEntityDefinition[]
}
