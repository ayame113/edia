document.getElementById("showDiagram")
  .addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: onRun,
    });
  });

async function onRun() {
  const { render } = await import(chrome.runtime.getURL("build/output.js"));

  /** @type {NodeListOf<HTMLElement>} */
  const table = document.querySelectorAll(".paper_table tr");
  const el = await render(table);
  document.querySelector(".__diagram__extension__result__")?.remove();
  el.classList.add("__diagram__extension__result__");
  document.querySelector(".paper_table_title")
    ?.insertAdjacentElement("afterend", el);
}
