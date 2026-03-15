// ==UserScript==
// @name         FastPic
// @namespace    https://github.com/anon-no-sound/cc
// @version      2026-03-15_001
// @downloadURL  https://raw.githubusercontent.com/anon-no-sound/cc/refs/heads/main/src/fastpic/tampermonkey.js
// @updateURL    https://raw.githubusercontent.com/anon-no-sound/cc/refs/heads/main/src/fastpic/tampermonkey.js
// @description  Tools for FastPic
// @author       anon-no-sound
// @match        https://fastpic.org/view/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=fastpic.org
// ==/UserScript==

(function () {
  "use strict";

  const nextHref = document.location.href.replace("/view/", "/fullview/");
  console.info("nextHref", nextHref);
  window.open(nextHref, "_self");
})();
