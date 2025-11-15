import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
    input: "src/index.ts",
    output: {
        file: "dist/mphttpx.js",
        format: "es",
    },
    plugins: [
        typescript({
            outDir: "dist",
            declarationDir: "dist/types",
        }),
        terser(),
    ],
}
