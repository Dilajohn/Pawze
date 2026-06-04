(function () {
  const key = "pawze-theme";
  const saved = localStorage.getItem(key);
  if (saved) {
    document.documentElement.dataset.theme = saved;
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-toggle]");
    if (!button) return;

    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(key, next);
  });
})();

