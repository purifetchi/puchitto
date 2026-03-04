/**
 * A MiniAntics atom.
 */
export type Atom = string | number

/**
 * A MiniAntics expression.
 */
export type Expression = Atom | Expression[]

/**
 * Parses the MiniAntics tokens into an expression.
 * @param tokens The tokens.
 * @returns The parsed expression.
 */
export const parse = (tokens: string[]) : Expression => {
    if (tokens.length < 1) {
        throw Error("No tokens to parse.")
    }

    const token = tokens.shift()!

    if (token == "(") {
        const expressions : Expression[] = []
        while (tokens[0] !== ")") {
            expressions.push(parse(tokens))
        }
        
        tokens.shift()
        return expressions
    }

    const floatVal = parseFloat(token)
    return isNaN(floatVal) ? token : floatVal
}