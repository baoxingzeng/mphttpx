import { dts } from "rollup-plugin-dts";
// import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default [
    {
        input: "src/index.ts",
        output: {
            dir: "dist/cjs",
            format: "cjs",
            // plugins: [terser()],
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
            // plugins: [terser()],
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
];
