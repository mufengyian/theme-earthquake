import "./styles/tailwind.css";
import "./styles/main.css";
import "./styles/markdown-body.css";
import "./styles/moment.css";
import "./styles/image-preview.css";
import Alpine from "alpinejs";

import colorSchemeSwitcher from "./alpine-data/color-scheme-switcher";
import dropdown from "./alpine-data/dropdown";
import share from "./alpine-data/share";
import uiPermission from "./alpine-data/ui-permission";
import upvote from "./alpine-data/upvote";
import "./components/number-formatter";
import { initImagePreview } from "./utils/image-preview";
import { generateToc } from "./utils/toc";

const earthWindow = window as Window & typeof globalThis;

let scrollUpdateScheduled = false;
let headerMenu: HTMLElement | null = null;
let scrollToTopButton: HTMLElement | null = null;

earthWindow.Alpine = Alpine;

Alpine.data("dropdown", dropdown);
Alpine.data("colorSchemeSwitcher", colorSchemeSwitcher);
Alpine.data("upvote", upvote);
Alpine.data("share", share);
Alpine.data("uiPermission", uiPermission);

Alpine.start();

const onScroll = () => {
  if (window.scrollY > 0) {
    headerMenu?.classList.add("menu-sticky");
  } else {
    headerMenu?.classList.remove("menu-sticky");
  }
};

const updateScrollToTopButton = () => {
  if (!scrollToTopButton) {
    return;
  }

  const visible = window.scrollY > 300;
  scrollToTopButton.style.opacity = visible ? "1" : "0";
  scrollToTopButton.style.pointerEvents = visible ? "auto" : "none";
};

const initScrollToTopButton = () => {
  if (!scrollToTopButton) {
    return;
  }

  scrollToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

const queueScrollUpdate = () => {
  if (scrollUpdateScheduled) {
    return;
  }

  scrollUpdateScheduled = true;
  window.requestAnimationFrame(() => {
    scrollUpdateScheduled = false;
    onScroll();
    updateScrollToTopButton();
  });
};

const initPageInteractions = () => {
  headerMenu = document.getElementById("header-menu");
  scrollToTopButton = document.getElementById("btn-scroll-to-top");
  initScrollToTopButton();
  initImagePreview();
  generateToc("content", ".toc", ".toc-container");
  onScroll();
  updateScrollToTopButton();
};

window.addEventListener("scroll", queueScrollUpdate, { passive: true });

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPageInteractions, {
    once: true,
  });
} else {
  initPageInteractions();
}
