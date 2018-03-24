/*
DELAY is set to 6 seconds in this example. Such a short period is chosen to make
the extension's behavior more obvious, but this is not recommended in real life.
Note that in Chrome, alarms cannot be set for less than a minute. In Chrome:

* if you install this extension "unpacked", you'll see a warning
in the console, but the alarm will still go off after 6 seconds
* if you package the extension and install it, then the alarm will go off after
a minute.
*/
var DELAY = 0.01;
var CATGIFS = "http://chilloutandwatchsomecatgifs.com/";

/*
Restart alarm for the currently active tab, whenever background.js is run.
*/
var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
gettingActiveTab.then((tabs) => {
  restartAlarm(tabs[0].id);
});

/*
Restart alarm for the currently active tab, whenever the user navigates.
*/
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url) {
    return;
  }
  var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then((tabs) => {
    if (tabId == tabs[0].id) {
      restartAlarm(tabId);
    }
  });
});

/*
Restart alarm for the currently active tab, whenever a new tab becomes active.
*/
browser.tabs.onActivated.addListener((activeInfo) => {
  restartAlarm(activeInfo.tabId);
});

/*
restartAlarm: clear all alarms,
then set a new alarm for the given tab.
*/
function restartAlarm(tabId) {
  browser.pageAction.hide(tabId);
  browser.alarms.clearAll();
  var gettingTab = browser.tabs.get(tabId);
  gettingTab.then((tab) => {
    if (tab.url != CATGIFS) {
      browser.alarms.create("", {delayInMinutes: DELAY});
    }
  });
}

/*
On alarm, show the page action.
*/
browser.alarms.onAlarm.addListener((alarm) => {
  var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then((tabs) => {
    browser.pageAction.show(tabs[0].id);
  });
});

/*
On page action click, navigate the corresponding tab to the cat gifs.
*/
browser.pageAction.onClicked.addListener(() => {
  browser.tabs.query({active:true,currentWindow:true}).then(function(tabs){
    browser.tabs.executeScript(tabs[0].tabId, {file: "/content_scripts/send_canonical_url.js"});
  });
});

browser.runtime.onMessage.addListener(recieveCanoUrl);

function recieveCanoUrl(message) {
  console.log("received: " + message.url)

  browser.tabs.query({active:true,currentWindow:true}).then(function(tabs){
    const currentTabUrl = message.url ? message.url : tabs[0].url;
    console.log("currentTabUrl" + currentTabUrl);
    const hatenaUrl = "http://b.hatena.ne.jp/api/viewer.popular_bookmarks?url=" + encodeURIComponent(currentTabUrl);
    console.log("hatenaUrl: " + hatenaUrl);
    const req = new Request(hatenaUrl);
    fetch(req).then(response => {
      if(!response.ok) {
        const status = response.status;
        response.text().then(text => {
          browser.notifications.create({
            "type": "basic",
            "title": "status: " + status,
            "message": currentTabUrl + " " + text
          });
        });
        return;
      }
      const json = response.json().then(data => {
        const entry_url = data.entry_url;
        browser.tabs.update({url: entry_url});
      });
    });
  });
}
