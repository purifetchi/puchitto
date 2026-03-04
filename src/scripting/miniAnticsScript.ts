import type MiniAnticsEnvironment from "./miniAnticsEnvironment.js";
import { parse, type Expression } from "./parser.js";
import { tokenize } from "./tokenizer.js";

/**
 * A MiniAntics script.
 */
export default class MiniAnticsScript {
    /**
     * The expression.
     */
    private _expression: Expression

    /**
     * The spcial handlers for the script.
     */
    private _specialHandlers : Record<string, (args: Expression[], env: MiniAnticsEnvironment) => any> = {
        "if": (args, env) => this._handleIf(args, env)
    }

    /**
     * Constructs a new miniantics script.
     * @param code The code to parse.
     */
    constructor(code: string) {
        const tokens = tokenize(code)
        this._expression = parse(tokens)

        console.log(this._expression)
    }

    /**
     * Runs the given script with an environment.
     * @param env The environment.
     * @returns The returned value from the miniantics script.
     */
    run(env: MiniAnticsEnvironment) : any {
        return this._eval(this._expression, env)
    }

    /**
     * Evaluates an expression.
     * @param x The expression.
     * @param env The environment.
     */
    private _eval(x: Expression, env: MiniAnticsEnvironment) : any {
        if (typeof(x) === "string") {
            const evaluated = env.get(x)
            return evaluated ?? x
        }

        if (typeof(x) === "number") {
            return x
        }

        if (Array.isArray(x)) {
            const [head, ...tail] = x

            if (this._isSpecial(head)) {
                return this._specialHandlers[head as string](tail, env)
            }

            const func = this._eval(head, env)
            const args = tail.map(t => this._eval(t, env))

            if (this._isFunction(func)) {
                return func(...args)
            }

            return undefined
        }

        throw new Error(`Unknown expression ${x}.`)
    }

    /**
     * Checks if the given expression is special.
     * @param obj The expression.
     */
    private _isSpecial(obj: Expression) : boolean {
        return typeof(obj) === "string" && obj in this._specialHandlers
    }

    /**
     * Handles the if expression.
     * @param obj The expression
     */
    private _handleIf( args: Expression[], env: MiniAnticsEnvironment) : any {
        const [ predicate, trueBranch, falseBranch ] = args

        const result = this._eval(predicate, env)
        if (result === true) {
            return this._eval(trueBranch, env)
        } else {
            return this._eval(falseBranch, env)
        }
    }

    /**
     * Checks whether the given object is a function.
     * @param obj The object.
     * @returns Whether it is a function.
     */
    private _isFunction(obj: any) : boolean {
        return !!(obj && obj.constructor && obj.call && obj.apply)
    }
}