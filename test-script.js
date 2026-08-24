const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable", pretendToBeVisual: true });

// Polyfill requestAnimationFrame for GSAP
dom.window.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};
dom.window.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

dom.window.addEventListener("error", (e) => {
    console.error("BROWSER ERROR:", e.error ? e.error.stack : e.message);
});

dom.window.addEventListener("unhandledrejection", (e) => {
    console.error("UNHANDLED PROMISE:", e.reason);
});

dom.window.document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded fired!");
});

setTimeout(() => {
    console.log("Done");
}, 4000);
