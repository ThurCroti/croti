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

dom.window.console.log = (...args) => console.log("BROWSER:", ...args);
dom.window.console.warn = (...args) => console.log("BROWSER WARN:", ...args);
dom.window.console.error = (...args) => console.log("BROWSER ERROR:", ...args);

// Inject a script into the DOM to log progress
const script = dom.window.document.createElement("script");
script.textContent = `
    document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM Loaded in browser context");
        const ps = document.getElementById("partners-section");
        const observer = new MutationObserver(() => {
            console.log("partners-section changed! length:", ps.innerHTML.length);
        });
        observer.observe(ps, { childList: true, subtree: true });
    });
`;
dom.window.document.head.appendChild(script);

setTimeout(() => {
    console.log("Done waiting 3 seconds");
}, 3000);

