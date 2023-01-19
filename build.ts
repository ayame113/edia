import { bundle } from "https://deno.land/x/emit@0.13.0/mod.ts";

const result = await bundle("./mod.js");

const { code } = result;
// console.log(code);

Deno.writeTextFile(
  new URL(import.meta.resolve("./bundle.js")),
  code,
);
