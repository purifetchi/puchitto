/**
 * Tokenizes a miniantics script into its individual tokens.
 * @param text The script.
 */
export const tokenize = (text: string): string[] => {
    const regex = /("[^"\\]*(?:\\[\S\s][^"\\]*)*"|\(|\)|\n|\s+|[^\s()]+)/
    text = text.trim()
    return text.split(regex).filter(t => t.trim().length)
}