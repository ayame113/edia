import { assertEquals } from "https://deno.land/std@0.171.0/testing/asserts.ts";
import { timeDiff } from "./mod.js";

Deno.test({
  name: "timeDiff",
  fn() {
    {
      const res = timeDiff({ hour: 4, minute: 30 }, { hour: 4, minute: 50 });
      assertEquals(res, 20);
    }
    {
      const res = timeDiff({ hour: 4, minute: 30 }, { hour: 5, minute: 30 });
      assertEquals(res, 60);
    }
    {
      const res = timeDiff({ hour: 4, minute: 30 }, { hour: 3, minute: 30 });
      assertEquals(res, 24 * 60 - 60);
    }
    {
      const res = timeDiff({ hour: 23, minute: 30 }, { hour: 0, minute: 30 });
      assertEquals(res, 60);
    }
  },
});
