import React, { useState, useEffect } from "react";
import { Card } from "react-bootstrap";
import { FiLayers, FiPlay, FiVideo } from "react-icons/fi";

export default function ProfilePostCard({ post, index, user, theme }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const media = post.media || [];
  const hasMultiple = media.length > 1;
  const firstMedia = media[0];

  const isVideo = firstMedia?.type === "video";
  const thumbnail = firstMedia?.thumbnail || (firstMedia?.type === "image" ? firstMedia?.url : null);

  const charLimit = isMobile ? 20 : 50;
  const contentSnippet = post.content
    ? post.content.substring(0, charLimit) + (post.content.length > charLimit ? "..." : "")
    : "";

  return (
    <Card
      className={`up-card h-100 border-0 overflow-hidden position-relative ${theme === "dark" ? "bg-dark" : "bg-light"}`}
      style={{ animationDelay: `${index * 40}ms`, cursor: "pointer", aspectRatio: "1/1" }}
    >
      {/* Top-right icon: multiple layers OR video — video takes priority on single items */}
      <div
        className="position-absolute top-0 end-0 m-2 z-3 text-white"
        style={{ filter: "drop-shadow(0px 0px 2px rgba(0,0,0,0.8))" }}
      >
        {hasMultiple ? <FiLayers size={18} /> : isVideo ? <FiVideo size={18} /> : null}
      </div>

      {/* Main body */}
      <div className="up-card-img-wrap h-100 w-100 d-flex align-items-center justify-content-center">
        {media.length > 0 ? (
          thumbnail ? (
            <Card.Img src={thumbnail} className="up-card-img h-100 w-100 object-fit-cover" />
          ) : (
            /* Video with no thumbnail — show centered play icon */
            <div className="text-secondary">
              <FiPlay size={30} />
            </div>
          )
        ) : (
          /* Text-only post */
          <div
            className={`w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-2 border-2 rounded-3 ${
              theme === "light"
                ? "bg-warning bg-opacity-10 border border-warning"
                : "bg-dark border border-warning"
            }`}
          >
            <span className="fw-bold text-warning mb-1" style={{ fontSize: "0.7rem" }}>
              @{user?.username || user}
            </span>
            <p
              className={`mb-0 ${theme === "light" ? "text-dark" : "text-light"}`}
              style={{ fontSize: isMobile ? "0.75rem" : "0.85rem", lineHeight: "1.2", overflowWrap: "anywhere" }}
            >
              {contentSnippet || "No content"}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}