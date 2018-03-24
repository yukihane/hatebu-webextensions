const canoUrl = document.querySelector('link[rel="canonical"]');

const target = canoUrl ? canoUrl.href : null;
browser.runtime.sendMessage({"url": target});
