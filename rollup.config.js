import { dts } from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: "dist/index.cjs.js",
                format: "cjs",
            },
            {
                file: "dist/index.cjs.min.js",
                format: "cjs",
                plugins: [terser()],
            },
            {
                file: "dist/index.esm.js",
                format: "es",
            },
            {
                file: "dist/index.esm.min.js",
                format: "es",
                plugins: [terser()],
            },
        ],
        plugins: [
            typescript({
                declarationDir: "dist/types",
            }),
        ],
    },

    {
        input: "dist/types/index.d.ts",
        output: {
            file: "dist/index.d.ts",
            format: "es",
        },
        plugins: [dts()],
    },
];
