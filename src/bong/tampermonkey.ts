// ==UserScript==
// @name         BongaCams
// @namespace    https://github.com/anon-no-sound/cc
// @version      2026-02-28_009
// @downloadURL  https://raw.githubusercontent.com/anon-no-sound/cc/refs/heads/main/src/bong/tampermonkey.js
// @updateURL    https://raw.githubusercontent.com/anon-no-sound/cc/refs/heads/main/src/bong/tampermonkey.js
// @description  Tools for BongaCams
// @author       anon-no-sound
// @match        https://*.bongacams35.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bongacams35.com
// @grant        GM_addElement
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  "use strict";

  const authorUsername = "anon4509";

  const commonHeaders = {
    "accept-language": "ru,en;q=0.9",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-ch-ua":
      '"Chromium";v="142", "YaBrowser";v="25.12", "Not_A Brand";v="99", "Yowser";v="2.5"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": navigator.userAgent,
    "x-requested-with": "XMLHttpRequest",
    priority: "u=1, i",
  };

  const csrfKey = "csrf_value";
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const awaitSelector = async (selector: string, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await wait(50);
    }
    return undefined;
  };

  const listBannedUsers = async (page: number): Promise<string[]> => {
    return fetch(`https://rf.bongacams35.com/blocked-users?page=${page}`, {
      headers: {
        ...commonHeaders,
        accept: "*/*",
      },
      referrer: location.origin,
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    })
      .then((r) => r.json())
      .then((r) => {
        console.log(r);
        const usernames = r.data.usersList.items.map((i: any) => i.username);
        for (const u of usernames) {
          console.info(`${location.origin}/${u}`);
        }
        return usernames;
      });
  };

  const getCSRFToken = (): string => {
    const csrfElement = document.querySelector(
      `[data-${csrfKey}]`,
    ) as HTMLDivElement;
    if (!csrfElement) {
      throw new Error("csrf element not found");
    }

    const csrfToken = csrfElement.dataset[csrfKey];
    if (!csrfToken) {
      throw new Error("csrf token not set");
    }

    return csrfToken;
  };

  const ban = async (username: string) => {
    if (!username) {
      throw new Error("username not provided");
    }

    console.info("banning", { username });

    const origin = window.location.origin;
    const referer = window.location.href;

    return fetch(`${origin}/api/profile/ban-user`, {
      method: "POST",
      headers: {
        ...commonHeaders,
        "content-type": "text/plaincharset=UTF-8",
        accept: "application/json",
        origin,
        referer,
        "x-csrf-token": getCSRFToken(),
      },
      body: JSON.stringify({ username, authorUsername }),
    }).then((response) => {
      if (response.status !== 200) {
        console.error("Failed to ban", { username, response });
      } else {
        console.info("Banned successfully", { username, response });
      }
      return response;
    });
  };

  const banMany = async (usernames: string[], delay = 500) => {
    for (const username of usernames) {
      await ban(username);
      await wait(delay);
    }
  };

  const unban = async (username: string) => {
    if (!username) {
      throw new Error("username not provided");
    }

    console.info("unbanning", { username });

    const origin = window.location.origin;
    const referer = window.location.href;

    return fetch(`${origin}/api/profile/unban-user`, {
      headers: {
        ...commonHeaders,
        accept: "application/json",
        "content-type": "text/plain;charset=UTF-8",
        origin,
        referer,
        "x-csrf-token": getCSRFToken(),
      },
      referrer: referer,
      body: JSON.stringify({
        usernames: [username],
        author_username: authorUsername,
      }),
      method: "POST",
      mode: "cors",
      credentials: "include",
    });
  };

  const unbanMany = async (usernames: string[], delay = 500) => {
    for (const username of usernames) {
      await unban(username);
      await wait(delay);
    }
  };

  const extractUsername = () => {
    const urlParts = document.location.pathname.split("/").filter(Boolean);
    return urlParts[urlParts.length - 1];
  };

  const openLCR = (displayName: string) => {
    if (!displayName) return;
    const url = `https://livecamrips.to/search/${displayName}`;
    window.open(url, "_blank");
  };

  const openStatbate = () => {
    const username = extractUsername();
    if (!username) return;
    const url = `https://statbate.com/search/2/${username}`;
    window.open(url, "_blank");
  };

  (unsafeWindow as any).utils = {
    awaitSelector,
    ban,
    banMany,
    extractUsername,
    listBannedUsers,
    openLCR,
    openStatbate,
    unban,
    unbanMany,
    wait,
  };

  let displayName = "";

  const addLinkButton = (
    toolbar: Element,
    id: string,
    text: string,
    onClick: () => void,
  ) => {
    if (toolbar.querySelector(`#${id}`)) return;

    const btn = GM_addElement(toolbar, "div", {
      id,
      class:
        "bc_inline_flex bc_flex_full_center mplg_btn bc_mrn_btn __hint plt_btn __light bc_inline_flex bc_flex_full_center",
    });

    btn.onclick = onClick;

    GM_addElement(btn, "div", {
      class: "mplg_btn_text",
      textContent: text,
    });
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
        if (!nameTag || !toolbar) return;

        try {
          const nextName = (nameTag as HTMLDivElement).innerText.trim();
          if (nextName != displayName) {
            displayName = nextName;
            console.info("name detected", { name: displayName });
          } else {
            return;
          }
        } catch (e) {
          console.error("name detection failed", e);
        }

        addLinkButton(toolbar, "btn-lcr", "LCR", () => openLCR(displayName));
        addLinkButton(toolbar, "btn-statbate", "Stats", openStatbate);

        if (!toolbar.querySelector("#btn-ban")) {
          const btn = GM_addElement(toolbar, "button", {
            id: "btn-ban",
            class:
              "bc_inline_flex bc_flex_full_center mplg_btn bc_mrn_btn __hint plt_btn __light bc_inline_flex bc_flex_full_center",
            title: "Ban from profile",
          });
          btn.innerText = "✕";

          btn.onclick = () => {
            const username = extractUsername();

            btn.innerText = "...";
            ban(username)
              .then(() => {
                window.close();
                window.history.back(); // scripts can't close stream page for some reason
              })
              .finally(() => {
                btn.innerText = "✕";
              });
          };
        }
      });
    }
  };

  const addBanButtons = () => {
    for (const toolbar of document.querySelectorAll(".lst_info")) {
      if (toolbar.querySelector(".unsubscribe-btn")) continue;

      const btn = GM_addElement(toolbar, "button", {
        class: "unsubscribe-btn lsti_box",
        style:
          "margin-left: 8px; border: none; border-radius: 22px; background: black; color: oklch(0.97 0.00 0); opacity: .8; cursor: pointer; height: 22px;",
      });
      btn.innerText = "✕";

      const handleBan = () => {
        const nickElement = toolbar.querySelector(
          "a.lst_nick",
        ) as HTMLAnchorElement;
        const username = nickElement?.href.split("/profile/")[1];

        btn.innerText = "...";
        ban(username).then(() => {
          btn.style = "display: none;";
        });
      };

      const handleClick = () => {
        const nickElement = toolbar.querySelector(
          "a.lst_nick",
        ) as HTMLAnchorElement;
        const username = nickElement?.href.split("/profile/")[1];

        btn.innerText = `Ban ${username}?`;
        btn.onclick = handleBan;

        setTimeout(() => {
          if (btn.innerText === "...") return;

          btn.innerText = "✕";
          btn.onclick = handleClick;
        }, 3000);
      };

      btn.onclick = handleClick;
    }
  };

  setInterval(addBanButtons, 1000);
  setTimeout(addBanButtons, 500);

  setInterval(addToolButtons, 1000);
  setTimeout(addToolButtons, 200);
})();
