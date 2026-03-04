/**
 * Defines the ALF header.
 */
export interface AlfHeader {
    headerStr: string;
    flags: number;
    count: number;
    pointer: number;
    isValid: boolean;
}