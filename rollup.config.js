import { dts } from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default [
    {
        input: "src/index.ts",
        output: {
            dir: "dist/cjs",
            format: "cjs",
            preserveModules: true,
        },
        plugins: [
            typescript({
                outDir: "dist/cjs",
                declarationDir: "dist/cjs/types",
            }),
        ],
    },
    {
        input: "src/index.ts",
        output: {
            dir: "dist/esm",
            format: "es",
            preserveModules: true,
        },
        plugins: [
            typescript({
                outDir: "dist/esm",
                declarationDir: "dist/esm/types",
            }),
        ],
    },
    {
        input: "dist/esm/types/index.d.ts",
        output: {
            file: "dist/index.d.ts",
            format: "es",
        },
        plugins: [dts()],
    },

    {
        input: "src/index.ts",
        output: {
            file: "dist/mphttpx.cjs.min.js",
            format: "cjs",
        },
        plugins: [
            typescript({
                declarationDir: "dist/types",
            }),
            terser(),
        ],
    },
    {
        input: "src/index.ts",
        output: {
            file: "dist/mphttpx.esm.min.js",
            format: "es",
        },
        plugins: [
            typescript({
                declarationDir: "dist/types",
            }),
            terser(),
        ],
    },
];
