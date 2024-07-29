const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');
const dts = require('rollup-plugin-dts');

const packageJson = require('./package.json');

module.exports = [
    {
        input: 'src/index.ts',
        output: [
            {
                file: packageJson.main,
                format: 'cjs',
                sourcemap: false,
            },
            {
                file: packageJson.module,
                format: 'esm',
                sourcemap: false,
            },
        ],
        external: ['axios', 'moment', 'shared/src/contrib/aidbox', '@beda.software/remote-data'],
        plugins: [
            resolve({
                browser: true,
                preferBuiltins: false,
            }),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
                compilerOptions: {
                    target: 'es2016',
                    module: 'ESNext',
                    moduleResolution: 'node',
                    sourceMap: false,
                },
                include: ['src/**/*'],
                exclude: ['**/__tests__/**/*', '**/*.test.*'],
            }),
        ],
    },
    {
        input: 'dist/esm/index.d.ts',
        output: [{ file: 'dist/index.d.ts', format: 'esm' }],
        external: [/\.(css|less|scss)$/],
        plugins: [dts.default()],
    },
];
