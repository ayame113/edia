// @ts-check

/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference path="https://esm.sh/chrome-types@0.1.165/index.d.ts" />

document.getElementById("showDiagram")
  ?.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    chrome.scripting.executeScript({
      target: { tabId: /** @type {number}*/ (tab.id) },
      func: onRun,
    });
  });

async function onRun() {
  const src = chrome.runtime.getURL("build/output.js");
  /** @type {import("../lib/mod.ts")} */
  const { generateDiagram } = await import(src);

  const table = document.querySelector(".paper_table");
  const el = await generateDiagram(/** @type {HTMLTableElement} */ (table));
  document.querySelector(".__diagram__extension__result__")?.remove();
  el.classList.add("__diagram__extension__result__");
  document.querySelector(".paper_table_title")
    ?.insertAdjacentElement("afterend", el);
}
