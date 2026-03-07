import { PuchittoPacket } from "../puchittoPacket";

/**
 * The join packet.
 */
export interface JoinPacket extends PuchittoPacket {

}

/**
 * The dummy used for writing a join packet.
 */
export const writeJoinPacket = () => {}
