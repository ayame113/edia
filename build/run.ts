import { bundle } from "https://deno.land/x/emit@0.13.0/mod.ts";

console.log("building...");

async function build() {
  return await bundle(new URL(import.meta.resolve("../lib/mod.ts")));
}

export const output = "../build/output.js";
export const code = `// deno-fmt-ignore-file
// deno-lint-ignore-file
${(await build()).code}`;

if (import.meta.main) {
  await Deno.writeTextFile(new URL(import.meta.resolve(output)), code);
}
