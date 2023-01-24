import { assertEquals } from "https://deno.land/std@0.173.0/testing/asserts.ts";
import { code as expected, output } from "./run.ts";

const actual = await Deno.readTextFile(new URL(import.meta.resolve(output)));

try {
  assertEquals(actual, expected);
} catch (error) {
  (error as Error)
    .message
    .split("\n")
    .filter((line) => line.includes("\x1b[32m") || line.includes("\x1b[31m"))
    .forEach((line) => console.log(line));
  throw "Did you forget to run `deno task build`?";
}
console.log("✅checked the build output");
