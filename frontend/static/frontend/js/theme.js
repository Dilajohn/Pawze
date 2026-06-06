(function () {
  const key = "pawze-theme";
  const saved = localStorage.getItem(key);

  if (saved) {
    // User has an explicit saved preference — honour it
    document.documentElement.dataset.theme = saved;
  } else {
    // No saved preference — follow the OS setting
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-toggle]");
    if (!button) return;

    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(key, next);
  });
})();

