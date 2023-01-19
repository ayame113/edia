document.getElementById("btn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: onRun,
  });
});

async function onRun() {
  document.body.style.backgroundColor = "#fcc";
  const url = chrome.runtime.getURL("bundle.js");
  console.log(url);
  await import(url);
}
