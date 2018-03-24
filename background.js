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
