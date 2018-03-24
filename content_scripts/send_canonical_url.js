const canoUrl = document.querySelector('link[rel="canonical"]');

const target = canoUrl ? canoUrl.href : null;
console.log("canoUrl: " + target);
browser.runtime.sendMessage({"url": target});
