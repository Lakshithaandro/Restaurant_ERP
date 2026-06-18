import { useEffect } from "react";

const REVEAL_SELECTOR = [
  ".card",
  ".section-head",
  ".menu-tile",
  ".ticket",
  ".portal-card",
  ".booking-card",
  ".track-card",
  ".customer-copy",
  ".hero-copy",
  ".landing-showcase",
  ".login-card",
].join(",");

export default function VisualEffects() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      document.documentElement.classList.add("motion-ready");
      return undefined;
    }

    const seen = new WeakSet();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );

    const register = () => {
      document.querySelectorAll(REVEAL_SELECTOR).forEach((node, index) => {
        if (seen.has(node)) return;
        seen.add(node);
        node.classList.add("revealable");
        node.style.setProperty("--reveal-delay", `${Math.min(index % 8, 6) * 55}ms`);
        observer.observe(node);
      });
      document.documentElement.classList.add("motion-ready");
    };

    const mutationObserver = new MutationObserver(register);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    register();

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <div className="ambient-layer" aria-hidden="true">
      <span className="ambient-blob blob-a" />
      <span className="ambient-blob blob-b" />
      <span className="ambient-blob blob-c" />
      <span className="ambient-grid" />
    </div>
  );
}
