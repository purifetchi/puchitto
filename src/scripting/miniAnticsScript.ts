import { MiniAnticsEnvironment } from "./miniAnticsEnvironment";
import { parse, type Expression } from "./parser";
import { tokenize } from "./tokenizer";

/**
 * A MiniAntics script.
 */
export class MiniAnticsScript {
    /**
     * The expression.
     */
    private _expression: Expression

    /**
     * The spcial handlers for the script.
     */
    private _specialHandlers : Record<string, (args: Expression[], env: MiniAnticsEnvironment) => any> = {
        "if": (args, env) => this._handleIf(args, env),
        "call-entity": (args, env) => this._handleCallEntity(args, env)
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
     * Handles calling a method in an entity's environment.
     * @param args The arguments.
     * @param env The environment.
     */
    private _handleCallEntity(args: Expression[], env: MiniAnticsEnvironment) : any {
        const [ entitySelector, expr ] = args

        const result: { environment: MiniAnticsEnvironment } = this._eval(entitySelector, env)
        const isCallableObject = result.environment !== undefined

        if (!isCallableObject) {
            throw new Error(`Could not perform a MiniAntics call on the object: ${result}`)
        }

        // HACK: If we're in the middle of an RPC just copy over the reader.
        //       We should deal with scoping better, but that's a problem for another me!
        const lastReader = result.environment.get("reader")

        result.environment.set("reader", env.get("reader"))
        const evalResult = this._eval(expr, result.environment)
        result.environment.set("reader", lastReader)

        return evalResult
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
