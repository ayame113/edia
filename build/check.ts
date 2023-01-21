import { assertEquals } from "https://deno.land/std@0.173.0/testing/asserts.ts";
import { code as expected, output } from "./run.ts";

const actual = await Deno.readTextFile(new URL(import.meta.resolve(output)));

try {
  assertEquals(actual, expected);
} catch (error) {
  console.error("Did you forget to run `deno task build`?");
  throw error;
}
console.log("✅checked the build output");
