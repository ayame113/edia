// https://developer.chrome.com/docs/extensions/reference/action/#emulating-pageactions-with-declarativecontent

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.disable();

  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostSuffix: ".jreast-timetable.jp" },
        }),
      ],
      actions: [new chrome.declarativeContent.ShowAction()],
    }]);
  });
});
