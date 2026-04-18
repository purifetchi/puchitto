import { GameObject } from "../objects"

/**
 * Polyfills the symbol metadata field.
 */
if (typeof Symbol.metadata === 'undefined') {
    (Symbol as any).metadata = Symbol.for('Symbol.metadata');
}

/**
 * The serialized metadata type.
 */
export type SerializedMetadataProps = Record<string | symbol, string>;

/**
 * Marks this accessor as being serialized.
 * @param path The path of the value within the JSON.
 */
export const Serialized = (path: string) => {
    return function <T extends GameObject, V>(
        target: ClassAccessorDecoratorTarget<T, V>,
        context: ClassAccessorDecoratorContext<T, V>
    ): ClassAccessorDecoratorResult<T, V> {
        if (context.metadata) {
            const props = (context.metadata.serializedProps ?? {}) as SerializedMetadataProps;
            props[context.name] = path;
            context.metadata.serializedProps = props;
        }

        return {
            get() {
                return target.get.call(this)
            },

            set(value: V) {
                const old = target.get.call(this)
                target.set.call(this, value)

                if (value !== old) {
                    this.onSerializedPropertyChanged(context.name.toString())
                }
            }
        }
    }
}
