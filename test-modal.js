const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable", pretendToBeVisual: true });

dom.window.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};
dom.window.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

dom.window.console.error = (...args) => console.log("BROWSER ERROR:", ...args);
dom.window.console.warn = (...args) => console.log("BROWSER WARN:", ...args);

const script = dom.window.document.createElement("script");
script.textContent = `
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
            console.log("Simulating click on first catalog card...");
            const firstCard = document.querySelector(".catalog-card");
            if (firstCard) {
                firstCard.click();
                setTimeout(() => {
                    const modal = document.getElementById("catalog-modal");
                    console.log("Modal is open:", modal.classList.contains("is-open"));
                }, 500);
            } else {
                console.log("No catalog cards found.");
            }
        }, 1000);
    });
`;
dom.window.document.head.appendChild(script);

setTimeout(() => {
    console.log("Done");
}, 2500);
