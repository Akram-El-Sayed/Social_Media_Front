import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import {
  FiArrowLeft,
  FiSend,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiPlay,
  FiX,
} from "react-icons/fi";
import { api } from "../../utils/api";

import { useNavigate } from "react-router-dom";
import ReactionUsersModal from "../ReactionUsersModal/ReactionUsersModal";
import { REACTIONS, typeToEmoji } from "../../utils/TypeToEmoji/TypeToEmoji";
import { useOnlineUsers } from "../../Hooks/useOnlineUsers";
import { useDispatch } from "react-redux";
import { setActiveConversation } from "../../Store/NotificationSlice/NotificationSlice";

/* Helpers */
const getOther = (conv, currentUser) => {
  const meId = currentUser?._id?.toString();
  if (!meId) return conv.participants?.at(-1);
  return (
    conv.participants?.find((p) => p._id?.toString() !== meId) ??
    conv.participants?.at(-1)
  );
};

const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const sameId = (a, b) => a?.toString() === b?.toString();

const groupReactions = (rawReactions = [], currentUserId) => {
  if (!rawReactions.length) return [];

  const map = {};

  rawReactions.forEach(({ user, type }) => {
    if (!type) return;

    const uid =
      typeof user === "object" && user !== null
        ? (user._id?.toString() ?? user.toString())
        : String(user ?? "");

    if (!map[type]) {
      map[type] = { type, count: 0, reactedByMe: false };
    }

    map[type].count++;

    // Strict string comparison — avoids any == coercion bugs
    if (uid && currentUserId && uid === String(currentUserId)) {
      map[type].reactedByMe = true;
    }
  });

  return Object.values(map);
};

/* StatusTick */
const StatusTick = ({ status }) => {
  if (status === "seen")
    return (
      <span className="msg-tick msg-tick--seen" title="Seen">
        ✓✓
      </span>
    );
  if (status === "delivered")
    return (
      <span className="msg-tick msg-tick--delivered" title="Delivered">
        ✓✓
      </span>
    );
  return (
    <span className="msg-tick" title="Sent">
      ✓
    </span>
  );
};

/* SharedPost */
const SharedPost = ({ post }) => {
  const navigate = useNavigate();
  const firstMedia = post.media?.[0];
  const isVideo =
    firstMedia?.type?.includes("video") ||
    firstMedia?.url?.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <div
      className="msg-shared"
      onClick={(e) => {
        e.stopPropagation();
        if (post?._id) navigate(`/post/${post._id}`);
      }}
      style={{ cursor: "pointer" }}
    >
      {firstMedia?.url && (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "150px",
            overflow: "hidden",
            borderRadius: "8px",
            marginBottom: "8px",
          }}
        >
          {isVideo ? (
            <div style={{ height: "100%", width: "100%" }}>
              <video
                src={firstMedia.url}
                className="msg-shared__img"
                muted
                preload="metadata"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <FiPlay
                size={30}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "white",
                  filter: "drop-shadow(0 0 4px rgba(0,0,0,0.5))",
                }}
              />
            </div>
          ) : (
            <img
              src={firstMedia.url}
              alt="shared"
              className="msg-shared__img"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>
      )}
      <div className="msg-shared__info">
        <p className="msg-shared__text">
          {post.content ? post.content.slice(0, 100) : "View Post"}
        </p>
        <span className="msg-shared__user">@{post.user?.username}</span>
      </div>
    </div>
  );
};

/* ReactionPicker */
const ReactionPicker = ({ onPick, mine }) => (
  <div className={`reaction-picker${mine ? " reaction-picker--mine" : ""}`}>
    {REACTIONS.map(({ emoji, type }) => (
      <button
        key={type}
        className="reaction-picker__btn"
        aria-label={`React ${type}`}
        onClick={(e) => {
          e.stopPropagation();
          onPick(type);
        }}
      >
        {emoji}
      </button>
    ))}
  </div>
);

/* ReactionBar */
const ReactionBar = ({ grouped, onToggle, onShowUsers }) => {
  if (!grouped?.length) return null;
  return (
    <div className="reaction-bar">
      {grouped.map((g) => (
        <span
          key={g.type}
          className={`reaction-pill${g.reactedByMe ? " reaction-pill--active" : ""}`}
        >
          <button
            className="reaction-pill__emoji"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(g.type);
            }}
            title={g.reactedByMe ? "Remove reaction" : "Add reaction"}
          >
            {typeToEmoji[g.type] ?? g.type}
          </button>
          <button
            className="reaction-pill__count"
            onClick={(e) => {
              e.stopPropagation();
              onShowUsers(g.type);
            }}
            title="See who reacted"
          >
            {g.count}
          </button>
        </span>
      ))}
    </div>
  );
};

// Animated "typing..." dots
const TYPING_STYLE_ID = "msg-typing-keyframes";
if (!document.getElementById(TYPING_STYLE_ID)) {
  const s = document.createElement("style");
  s.id = TYPING_STYLE_ID;
  s.textContent = `
    @keyframes msgTypingBounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40%            { transform: translateY(-5px); opacity: 1; }
    }
    .msg-typing-dot {
      display: inline-block;
      width: 5px; height: 5px;
      border-radius: 50%;
      background: currentColor;
      margin: 0 2px;
      animation: msgTypingBounce 1.2s infinite ease-in-out;
    }
    .msg-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .msg-typing-dot:nth-child(3) { animation-delay: 0.4s; }
  `;
  document.head.appendChild(s);
}

const TypingDots = () => (
  <span aria-label="typing">
    <span className="msg-typing-dot" />
    <span className="msg-typing-dot" />
    <span className="msg-typing-dot" />
  </span>
);

/* Main Component */
export default function MessagePanel({
  conversation,
  currentUser,
  socket,
  isConnected,
  onBack,
  onLastMessage,
  onGhostResolved,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [activeMsgId, setActiveMsgId] = useState(null);
  const [reactionModal, setReactionModal] = useState(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const dispatch = useDispatch();
  const bottomRef = useRef(null);
  const prevMsgLengthRef = useRef(0);
  const holdTimerRef = useRef(null);
  const isTypingRef = useRef(false); // tracks whether we've emitted typing:start
  const typingStopTimerRef = useRef(null); // debounce timer for typing:stop

  const onlineUsers = useOnlineUsers();

  const isGhost = !conversation._id;
  const other = getOther(conversation, currentUser);
  const currentUserId = currentUser?._id?.toString();
  const ownMessageIds = useRef(new Set());
  const currentUserIdRef = useRef(currentUser?._id?.toString());

  // Derived: is the other person online?
  const isOtherOnline = other ? onlineUsers.has(other._id?.toString()) : false;

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const startHold = useCallback(
    (messageId) => {
      clearHoldTimer();
      holdTimerRef.current = setTimeout(() => {
        setActiveMsgId(messageId);
      }, 450);
    },
    [clearHoldTimer],
  );

  const cancelHold = useCallback(() => {
    clearHoldTimer();
  }, [clearHoldTimer]);

  useEffect(() => {
  if (!conversation._id) return;
  dispatch(setActiveConversation(conversation._id.toString()));
  return () => dispatch(setActiveConversation(null));   
}, [conversation._id, dispatch]);

  useEffect(() => {
    currentUserIdRef.current = currentUser?._id?.toString();
  }, [currentUser]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (!activeMsgId) return;
      const el = document.querySelector(`[data-message-id="${activeMsgId}"]`);
      if (el && !el.contains(e.target)) setActiveMsgId(null);
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [activeMsgId]);

  /* Scroll on load */
  useEffect(() => {
    if (loading) return;
    prevMsgLengthRef.current = messages.length;
    const f = requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "instant" }),
    );
    return () => cancelAnimationFrame(f);
  }, [loading, messages.length]);

  /* Smooth scroll on new messages */
  useEffect(() => {
    if (loading) return;
    if (messages.length <= prevMsgLengthRef.current) {
      prevMsgLengthRef.current = messages.length;
      return;
    }
    prevMsgLengthRef.current = messages.length;
    const f = requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
    return () => cancelAnimationFrame(f);
  }, [messages, loading]);

  /* Initial fetch */
  useEffect(() => {
    if (isGhost) {
      setLoading(false);
      return;
    }

    const init = async () => {
      setLoading(true);
      setMessages([]);
      ownMessageIds.current.clear();

      if (socket && isConnected)
        socket.emit("join_conversation", conversation._id);

      try {
        const { data } = await api.get(
          `/api/messages/conversations/${conversation._id}`,
        );

        const normalised = data.messages.map((m) => ({
          ...m,
          reactions: groupReactions(m.reactions ?? [], currentUserId),
        }));
        setMessages(normalised);

        const hasUnread = data.messages.some(
          (m) =>
            (m.sender?._id ?? m.sender)?.toString() !== currentUserId &&
            m.status !== "seen",
        );

        if (hasUnread) {
          await api.patch(
            `/api/messages/conversations/${conversation._id}/seen`,
          );
          if (socket && isConnected)
            socket.emit("message:mark_seen", {
              conversationId: conversation._id,
              seenBy: currentUserId,
            });
        }
      } catch (err) {
        console.error("getMessages error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [conversation._id, isGhost, socket, isConnected, currentUserId]);

  /* Socket listeners — messages + typing */
  useEffect(() => {
    if (!socket || !isConnected || isGhost) return;

    const onNew = (msg) => {
      const convId = (msg.conversation?._id ?? msg.conversation)?.toString();
      if (convId !== conversation._id.toString()) return;

      const msgId = msg._id?.toString();
      const senderId = (msg.sender?._id ?? msg.sender)?.toString();

      if (ownMessageIds.current.has(msgId) || senderId === currentUserId) {
        ownMessageIds.current.delete(msgId);
        return;
      }

      setMessages((prev) =>
        prev.some((m) => m._id?.toString() === msgId)
          ? prev
          : [
              ...prev,
              {
                ...msg,
                reactions: groupReactions(msg.reactions ?? [], currentUserId),
              },
            ],
      );

      if (senderId !== currentUserId) {
        api
          .patch(`/api/messages/conversations/${conversation._id}/seen`)
          .catch(() => {});
        socket.emit("message:mark_seen", {
          conversationId: conversation._id,
          seenBy: currentUserId,
        });
      }

      onLastMessage?.(conversation._id, msg);
    };

    const onSeen = ({ conversationId }) => {
      if (conversationId?.toString() !== conversation._id.toString()) return;
      setMessages((prev) =>
        prev.map((m) =>
          (m.sender?._id ?? m.sender)?.toString() === currentUserId
            ? { ...m, status: "seen" }
            : m,
        ),
      );
    };

    const onDelivered = ({ conversationId }) => {
      if (conversationId?.toString() !== conversation._id.toString()) return;
      setMessages((prev) =>
        prev.map((m) =>
          (m.sender?._id ?? m.sender)?.toString() === currentUserId &&
          m.status === "sent"
            ? { ...m, status: "delivered" }
            : m,
        ),
      );
    };

    const onDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id?.toString() === messageId?.toString()
            ? { ...m, text: "This message was deleted", deleted: true }
            : m,
        ),
      );
    };

    const onEdited = ({ messageId, text: newText, isEdited, editedAt }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id?.toString() === messageId?.toString()
            ? { ...m, text: newText, isEdited, editedAt }
            : m,
        ),
      );
    };

    const onReactionUpdated = ({
      messageId,
      reactions,
      conversationId: incomingConvId,
    }) => {
      if (
        incomingConvId &&
        incomingConvId.toString() !== conversation._id.toString()
      ) {
        return;
      }

      // Always read the ref, not the closure-captured string
      const meId = currentUserIdRef.current;

      // Re-group from the raw server array — this is the source of truth
      const grouped = groupReactions(reactions ?? [], meId);

      setMessages((prev) =>
        prev.map((m) =>
          m._id?.toString() === messageId?.toString()
            ? { ...m, reactions: grouped }
            : m,
        ),
      );
    };

    // TYPING
    const onTyping = ({ conversationId, userId }) => {
      if (conversationId?.toString() !== conversation._id?.toString()) return;
      if (userId?.toString() === currentUserId?.toString()) return;
      setPeerTyping(true);
    };

    const onStopTyping = ({ conversationId, userId }) => {
      if (conversationId?.toString() !== conversation._id?.toString()) return;
      if (userId?.toString() === currentUserId?.toString()) return;
      setPeerTyping(false);
    };

    socket.on("message:new", onNew);
    socket.on("message:seen", onSeen);
    socket.on("message:delivered", onDelivered);
    socket.on("message:deleted", onDeleted);
    socket.on("message:edited", onEdited);
    socket.on("message:reaction", onReactionUpdated);
    socket.on("typing", onTyping);
    socket.on("stop_typing", onStopTyping);

    return () => {
      socket.off("message:new", onNew);
      socket.off("message:seen", onSeen);
      socket.off("message:delivered", onDelivered);
      socket.off("message:deleted", onDeleted);
      socket.off("message:edited", onEdited);
      socket.off("message:reaction", onReactionUpdated);
      socket.off("typing", onTyping);
      socket.off("stop_typing", onStopTyping);
    };
  }, [
    socket,
    isConnected,
    isGhost,
    conversation._id,
    currentUserId,
    onLastMessage,
  ]);

  useEffect(() => {
    const receiverId = other?._id?.toString();
    return () => {
      if (isTypingRef.current && socket && isConnected && !isGhost) {
        socket.emit("typing:stop", {
          conversationId: conversation._id,
          receiverId,
        });
        isTypingRef.current = false;
      }
      clearTimeout(typingStopTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation._id]);

  /* React */
  const handleReact = useCallback(
    async (messageId, type) => {
      if (!socket?.connected || isGhost) return;

      // Snapshot for rollback
      let snapshot;

      setMessages((prev) => {
        snapshot = prev; // capture before mutation

        return prev.map((m) => {
          if (m._id?.toString() !== messageId?.toString()) return m;

          const syntheticRaw = [];

          (m.reactions ?? []).forEach((g) => {
            for (let i = 0; i < g.count; i++) {
              if (i === 0 && g.reactedByMe) {
                syntheticRaw.push({
                  user: { _id: currentUserIdRef.current },
                  type: g.type,
                });
              } else {
                syntheticRaw.push({ user: { _id: "__other__" }, type: g.type });
              }
            }
          });

          // Toggle: replicate the server's logic exactly
          const meId = currentUserIdRef.current;
          const existingIdx = syntheticRaw.findIndex(
            (r) => (r.user?._id?.toString() ?? r.user?.toString()) === meId,
          );

          if (existingIdx !== -1) {
            const mine = syntheticRaw[existingIdx];
            if (mine.type === type) {
              // Same emoji → remove
              syntheticRaw.splice(existingIdx, 1);
            } else {
              // Different emoji → replace
              syntheticRaw[existingIdx].type = type;
            }
          } else {
            // No prior reaction → add
            syntheticRaw.push({ user: { _id: meId }, type });
          }

          return { ...m, reactions: groupReactions(syntheticRaw, meId) };
        });
      });

      setActiveMsgId(null);

      // Emit to server
      // Use the same `socket` the listeners are on (not getSocket())
      socket.emit(
        "message:react",
        { messageId, type, conversationId: conversation._id },
        (ack) => {
          // If your server sends an ack with { error }, roll back
          if (ack?.error) {
            console.error("Reaction rejected by server:", ack.error);
            setMessages(snapshot);
          }
        },
      );
    },
    [socket, isGhost, conversation._id],
  );

  /* Send */
  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const msgText = text.trim();
    setText("");

    if (isTypingRef.current && socket && isConnected && !isGhost) {
      socket.emit("typing:stop", {
        conversationId: conversation._id,
        receiverId: other?._id?.toString(),
      });
      isTypingRef.current = false;
    }
    clearTimeout(typingStopTimerRef.current);

    try {
      const { data } = await api.post("/api/messages", {
        receiverId: other?._id,
        text: msgText,
      });

      ownMessageIds.current.add(data._id?.toString());

      if (isGhost) {
        const { data: convData } = await api.get("/api/messages/conversations");
        const realConvId = (
          data.conversation?._id ?? data.conversation
        )?.toString();
        const realConv = convData.conversations.find(
          (c) => c._id === realConvId,
        );

        setMessages([{ ...data, reactions: [] }]);

        if (realConv) {
          onGhostResolved?.(realConv);
          if (socket && isConnected)
            socket.emit("join_conversation", realConv._id);
        }
        onLastMessage?.(realConvId, data);
      } else {
        setMessages((prev) => [...prev, { ...data, reactions: [] }]);
        onLastMessage?.(conversation._id, data);
      }
    } catch (err) {
      console.error("Send error:", err);
      setText(msgText);
    } finally {
      setSending(false);
    }
  }, [
    text,
    sending,
    isGhost,
    other,
    conversation._id,
    socket,
    isConnected,
    onLastMessage,
    onGhostResolved,
  ]);

  /* Delete */
  const handleDelete = async (messageId) => {
    try {
      await api.delete(`/api/messages/${messageId}`);
      setMessages((prev) =>
        prev.map((m) =>
          sameId(m._id, messageId)
            ? { ...m, text: "This message was deleted", deleted: true }
            : m,
        ),
      );
    } catch (err) {
      console.error("deleteMessage error:", err);
    }
  };

  /* Edit */
  const handleEditSave = async (messageId) => {
    if (!editText.trim()) return;
    const newText = editText.trim();
    try {
      await api.patch(`/api/messages/${messageId}`, { text: newText });
      setMessages((prev) =>
        prev.map((m) =>
          sameId(m._id, messageId)
            ? {
                ...m,
                text: newText,
                isEdited: true,
                editedAt: new Date().toISOString(),
              }
            : m,
        ),
      );
      setEditingId(null);
    } catch (err) {
      console.error("editMessage error:", err);
    }
  };

  // TYPING
  const handleTextChange = useCallback(
    (e) => {
      setText(e.target.value);

      if (!socket || !isConnected || isGhost) return;

      // Ensure we have the other user's ID
      const receiverId = other?._id?.toString();
      if (!receiverId) return;

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        socket.emit("typing:start", {
          conversationId: conversation._id,
          receiverId: receiverId,
        });
      }

      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        socket.emit("typing:stop", {
          conversationId: conversation._id,
          receiverId: receiverId,
        });
      }, 2000);
    },
    [socket, isConnected, isGhost, conversation._id, other],
  );
  /* Render */
  return (
    <div className="msg-panel">
      {/* Header */}
      <div className="msg-panel__header rounded-4">
        <button
          className="msg-panel__back btn btn-link p-0"
          onClick={onBack}
          aria-label="Back"
        >
          <FiArrowLeft size={20} />
        </button>

        {/* Avatar with online dot */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
            flexShrink: 0,
          }}
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
                display: "block",
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
          {/* Online / Offline dot */}
          <span
            title={isOtherOnline ? "Online" : "Offline"}
            style={{
              position: "absolute",
              bottom: 1,
              right: 1,
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: isOtherOnline ? "#22c55e" : "#9ca3af",
              border: "2px solid var(--bs-body-bg, #212529)",
              display: "block",
            }}
          />
        </div>

        {/* Username + online status / typing indicator */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          <span className="msg-panel__name" style={{ lineHeight: 1.2 }}>
            {other?.username}
          </span>
          <span
            style={{
              fontSize: "0.7rem",
              color: peerTyping
                ? "#22c55e"
                : isOtherOnline
                  ? "#22c55e"
                  : "#9ca3af",
              lineHeight: 1,
              marginTop: 2,
            }}
          >
            {peerTyping ? (
              <>
                <TypingDots />
              </>
            ) : isOtherOnline ? (
              "Online"
            ) : (
              "Offline"
            )}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="msg-panel__body">
        {loading ? (
          <div className="text-center p-5">
            <Spinner size="sm" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted small mt-4">
            No messages yet — say hello! 👋
          </p>
        ) : (
          messages.map((msg) => {
            const mine = sameId(msg.sender?._id ?? msg.sender, currentUserId);
            const isActive = activeMsgId === msg._id;

            return (
              <div
                key={msg._id}
                data-message-id={msg._id}
                className={`msg-row${mine ? " msg-row--mine" : ""}`}
                onPointerDown={() => startHold(msg._id)}
                onPointerUp={cancelHold}
                onPointerLeave={cancelHold}
                onContextMenu={(e) => e.preventDefault()}
              >
                {isActive && mine && !msg.deleted && (
                  <div className="msg-actions">
                    <button
                      className="msg-actions__btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(msg._id);
                        setEditText(msg.text);
                        setActiveMsgId(null);
                      }}
                    >
                      <FiEdit2 size={12} />
                    </button>
                    <button
                      className="msg-actions__btn msg-actions__btn--danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(msg._id);
                        setActiveMsgId(null);
                      }}
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                )}

                {isActive && !msg.deleted && (
                  <ReactionPicker
                    mine={mine}
                    onPick={(type) => handleReact(msg._id, type)}
                  />
                )}

                <div
                  className={`msg-bubble${
                    mine ? " msg-bubble--mine bg-info" : " msg-bubble--theirs"
                  }`}
                >
                  {msg.sharedPost && !msg.deleted && (
                    <SharedPost post={msg.sharedPost} />
                  )}

                  {editingId === msg._id ? (
                    <div className="msg-edit">
                      <Form.Control
                        size="sm"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEditSave(msg._id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <div className="msg-edit__row">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleEditSave(msg._id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={`msg-text${msg.deleted ? " msg-text--deleted" : ""}`}
                    >
                      {msg.text}
                    </p>
                  )}

                  {msg.isEdited && !msg.deleted && (
                    <span className="msg-edited">edited</span>
                  )}

                  <div className="msg-footer">
                    <span className="msg-time">{fmtTime(msg.createdAt)}</span>
                    {mine && <StatusTick status={msg.status} />}
                  </div>
                </div>

                <ReactionBar
                  grouped={msg.reactions}
                  onToggle={(type) => handleReact(msg._id, type)}
                  onShowUsers={(type) =>
                    setReactionModal({ messageId: msg._id, type })
                  }
                />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="msg-panel__footer rounded-4">
        <Form.Control
          className="msg-panel__input rounded-4"
          placeholder="Type a message…"
          value={text}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          variant="primary"
          className="msg-panel__send rounded-3"
          onClick={handleSend}
          disabled={sending || !text.trim()}
        >
          {sending ? <Spinner size="sm" /> : <FiSend size={16} />}
        </Button>
      </div>

      {/* Who-reacted modal */}
      {reactionModal && (
        <ReactionUsersModal
          messageId={reactionModal.messageId}
          type={reactionModal.type}
          onClose={() => setReactionModal(null)}
        />
      )}
    </div>
  );
}
