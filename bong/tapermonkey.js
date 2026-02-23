// ==UserScript==
// @name         Bong
// @namespace    http://tampermonkey.net/
// @version      2026-02-13
// @description  try to take over the world!
// @author       You
// @match        https://*.bongacams35.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bongacams35.com
// @grant        GM_addElement
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  "use strict";

  const authorUsername = "anon4509";

  const csrfKey = "csrf_value";
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const awaitSelector = async (selector, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await wait(50);
    }
    return undefined;
  };

  let displayName = "";
  const openLCR = () => {
    if (!displayName) return;
    const url = `https://livecamrips.to/search/${displayName}`;
    window.open(url, "_blank");
  };

  const addToolButtons = () => {
    const cases = [
      [
        "#profile-content > div.mplg_header.bc_flex.bc_flex_items_center.bc_flex_justify_s_between > div.mplg_h_info.bc_flex.bc_flex_items_center > div.mplg_name_wrp.bc_flex.bc_flex_items_center > h1",
        "#profile-content > div.mplg_header.bc_flex.bc_flex_items_center.bc_flex_justify_s_between > div.mplg_prf_actions.bc_flex.bc_flex_items_center.bc_flex_justify_f_end.__show",
      ],
      [
        "#appWrapper > div > div.plt_section.plt_header > div.plt_h_item.__sub_title.bc_flex.bc_flex_justify_s_between > div.plt_h_info > div.plt_h_title.bc_flex.bc_flex_items_center > h1",
        "#appWrapper > div > div.plt_section.plt_header > div.plt_h_item.__actions.bc_flex.bc_flex_justify_s_between > div.plt_h_btn_group.__plt_h_actions.bc_flex",
      ],
    ];

    for (const [nameTagSelector, toolbarSelector] of cases) {
      Promise.all([
        awaitSelector(nameTagSelector),
        awaitSelector(toolbarSelector),
      ]).then(([nameTag, toolbar]) => {
        if (!nameTag) return;

        try {
          const nextName = nameTag?.innerText?.trim();
          if (nextName != displayName) {
            displayName = nextName;
            console.info("name detected", { name: displayName });
          } else {
            return;
          }
        } catch (e) {
          console.error("name detection failed", e);
        }

        const username = document.location.pathname.split("/")[2];

        if (!toolbar.querySelector("#btn-lcr")) {
          const btn = GM_addElement(toolbar, "div", {
            id: "btn-lcr",
            class:
              "bc_inline_flex bc_flex_full_center mplg_btn bc_mrn_btn __hint plt_btn __light bc_inline_flex bc_flex_full_center",
            title: displayName,
          });

          btn.onclick = openLCR;

          GM_addElement(btn, "div", {
            class: "mplg_btn_text",
            textContent: "LCR",
          });
        }

        if (!toolbar.querySelector("#btn-ban")) {
          const btn = GM_addElement(toolbar, "button", {
            id: "btn-ban",
            class:
              "bc_inline_flex bc_flex_full_center mplg_btn bc_mrn_btn __hint plt_btn __light bc_inline_flex bc_flex_full_center",
            title: "Ban from profile",
          });
          btn.innerText = "Ban";

          btn.onclick = () => {
            btn.innerText = "...";
            unsubscribe(username)
              .then(() => {
                window.close();
              })
              .finally(() => {
                btn.innerText = "Ban";
              });
          };
        }
      });
    }
  };

  const unsubscribe = async (username) => {
    const csrfToken = document.querySelector(`[data-${csrfKey}]`).dataset[
      csrfKey
    ];
    if (!csrfToken) {
      console.error("csrf token not found");
      return;
    }
    if (!username) {
      console.error("username not provided");
      return;
    }

    console.info("Unsubscribing", { username });

    const origin = window.location.origin;
    const referer = window.location.href;

    const options = {
      method: "POST",
      url: `${origin}/api/profile/ban-user`,
      headers: {
        "content-type": "text/plaincharset=UTF-8",
        accept: "application/json",
        "accept-language": "ru,enq=0.9",
        origin,
        referer,
        "x-csrf-token": csrfToken,
        "user-agent": navigator.userAgent,
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium"v="142", "YaBrowser"v="25.12", "Not_A Brand"v="99", "Yowser"v="2.5"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
      },
      data: JSON.stringify({ username, authorUsername }),
      fetch: true,
    };

    await GM.xmlHttpRequest(options).then((response) => {
      if (response.status !== 200) {
        console.error("Failed to unsubscribe", {
          username,
          options,
          response,
        });
      } else {
        console.info("Unsubscribed successfully", {
          username,
          options,
          response,
        });
      }
    });
  };

  const addBanButtons = () => {
    for (const toolbar of document.querySelectorAll(".lst_info")) {
      if (toolbar.querySelector(".unsubscribe-btn")) continue;

      const btn = GM_addElement(toolbar, "button", {
        class: "unsubscribe-btn lsti_box",
        style:
          "margin-left: 8px; border: none; border-radius: 2px; background: oklch(0.27 0.00 0); color: oklch(0.97 0.00 0); opacity: .8; cursor: pointer;",
      });
      btn.innerText = `Ban`;

      const handleBan = (username) => () => {
        btn.innerText = "...";
        unsubscribe(username)
          .then(() => {
            btn.style = "display: none;";
          })
          .finally(() => {
            btn.innerText = `Ban ${username}`;
          });
      };

      const handleClick = () => {
        const username = btn.parentElement
          .querySelector("a.lst_nick")
          .href.split("/profile/")[1];
        btn.innerText = `Ban ${username}?`;
        btn.onclick = handleBan(username);

        setTimeout(() => {
          if (btn.innerText === "...") return;

          btn.innerText = `Ban`;
          btn.onclick = handleClick;
        }, 3000);
      };

      btn.onclick = handleClick;
    }
  };

  setInterval(addBanButtons, 1000);
  setInterval(addToolButtons, 1000);

  setTimeout(addToolButtons, 200);
  setTimeout(addBanButtons, 500);
})();
