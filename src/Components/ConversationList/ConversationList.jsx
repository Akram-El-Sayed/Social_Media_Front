import React, { useState, useCallback } from "react";
import { Form, Badge, Spinner } from "react-bootstrap";
import { api } from "../../utils/api";
import { FiUser } from "react-icons/fi";

/* Helpers */
const getOther = (conv, currentUser) => {
  const meId = currentUser?._id?.toString();
  // If currentUser isn't loaded yet, return last participant (not first,
  // since participants[0] is usually the sender = you)
  if (!meId) return conv.participants?.at(-1);
  return (
    conv.participants?.find((p) => p._id?.toString() !== meId) ??
    conv.participants?.at(-1)
  );
};

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const previewText = (msg) => {
  if (!msg) return "No messages yet";
  if (msg.deleted) return "🚫 Message deleted";
  if (msg.sharedPost) return "📎 Shared a post";
  return msg.text || "";
};

/* Component */
export default function ConversationList({
  conversations,
  activeConv,
  currentUser,
  loading,
  onSelect,
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (e) => {
    const val = e.target.value;
    setSearch(val);
    if (!val.trim()) {
      setResults(null);
      return;
    }

    setSearching(true);
    try {
      const { data } = await api.get(
        `/api/messages/conversations/search?search=${encodeURIComponent(val.trim())}`,
      );
      setResults(data.conversations);
    } catch (err) {
      console.error("searchConversations error:", err);
    } finally {
      setSearching(false);
    }
  }, []);

  const displayed = results ?? conversations;

  return (
    <div className="conv-list">
      <div className="conv-list__header rounded-4">
        <h6 className="conv-list__title">Messages</h6>
        <Form.Control
          type="search"
          size="sm"
          placeholder="Search conversations…"
          value={search}
          onChange={handleSearch}
          className="conv-list__search rounded-4"
        />
      </div>

      <div className="conv-list__body">
        {(loading || searching) && (
          <div className="conv-list__spinner">
            <Spinner size="sm" />
          </div>
        )}

        {!loading && !searching && displayed.length === 0 && (
          <p className="conv-list__empty">
            {search ? "No results found" : "No conversations yet"}
          </p>
        )}

        {displayed.map((conv) => {
          const other = getOther(conv, currentUser);
          const isActive = activeConv?._id === conv._id;
          const unread = conv.unreadCount || 0;

          return (
            <div
              key={conv._id}
              className={` border-bottom rounded-4 conv-item${isActive ? " conv-item--active" : ""}`}
              onClick={() => onSelect(conv)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelect(conv)}
            >
              {other.profilePicture ? (
                <img
                  src={other.profilePicture}
                  alt={other.username}
                  width={45}
                  height={45}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px groove #4dffbe",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: "50%",
                    border: "3px groove #4dffbe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiUser />
                </div>
              )}
              <div className="conv-item__info">
                <div className="conv-item__row">
                  <span className="conv-item__name">{other?.username}</span>
                  <span className="conv-item__time">
                    {fmtTime(conv.updatedAt)}
                  </span>
                </div>
                <div className="conv-item__row">
                  <span className="conv-item__preview">
                    {previewText(conv.lastMessage)}
                  </span>
                  {unread > 0 && (
                    <Badge bg="primary" pill className="conv-item__badge">
                      {unread > 99 ? "99+" : unread}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
