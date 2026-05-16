import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const excludedPaths = ["/", "/Reels", "/Conversations"];

    const isExcluded = excludedPaths.some((path) =>
      pathname === path || pathname.startsWith(path + "/")
    );

    if (!isExcluded) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}