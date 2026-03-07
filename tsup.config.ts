import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        networking: 'src/networking/index.ts',
        scripting: 'src/scripting/index.ts',
        components: 'src/components/index.ts',
        tweening: 'src/tweening/index.ts',
        objects: 'src/objects/index.ts',
        data: 'src/data/index.ts',
        alf: 'src/data/alf/index.ts',
        level: 'src/level/index.ts'
    },
    format: ['esm'],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    treeshake: false,
    bundle: true,
    external: ['three', '@mary/events']
});
