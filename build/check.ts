import { assertEquals } from "https://deno.land/std@0.173.0/testing/asserts.ts";
import { code as expected, output } from "./run.ts";

const actual = await Deno.readTextFile(new URL(import.meta.resolve(output)));

assertEquals(actual, expected, "Did you forget to run `deno task build`?");
console.log("✅checked the build output");
