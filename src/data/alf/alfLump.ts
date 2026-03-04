/**
 * Defines a single lump in an ALF file.
 */
export class AlfLump {
    constructor(
        public checksum: number,
        public size: number,
        public pointer: bigint,
        public path: string
    ) {}
}