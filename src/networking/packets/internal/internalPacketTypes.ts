/**
 * The internal packet types.
 */
export enum InternalPacketTypes {
    /**
     * Server -> Client: Branding and game rules information
     */
    HELLO = 1,

    /**
     * Client -> Server: Join realm
     */
    JOIN = 2,

    /**
     * Server -> Client: Load specific level file
     */
    LOAD = 3,

    /**
     * Client -> Server: Update the current load state
     */
    LOAD_STATE_UPDATE = 4,

    /**
     * Server -> Client: Create given entity.
     */
    CREATE_ENTITY = 5,

    /**
     * Server -> Client: Removes a given entity.
     */
    REMOVE_ENTITY = 6
}