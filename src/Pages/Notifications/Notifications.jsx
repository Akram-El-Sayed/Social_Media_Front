import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { api } from "../../utils/api";
import { useSocket } from "../../Hooks/useSocket";
// Add setUnreadCount to your import
import { decrementUnread, clearUnread, setUnreadCount } from "../../Store/NotificationSlice/NotificationSlice";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get("/api/notifications");
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // Real-time: new notification arrives while user IS on this page
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handler = (notification) => {
      setNotifications((prev) => [{ ...notification, read: false }, ...prev]);
    };

    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
  }, [socket, isConnected]);

  // ── Mark ALL as read
 const handleMarkAllRead = useCallback(async () => {
  const hasUnread = notifications.some((n) => !n.read);
  if (!hasUnread || markingAll) return;

  // Snapshot BEFORE optimistic update — so rollback is exact
  const previousNotifications = notifications;
  const previousUnreadCount = previousNotifications.filter((n) => !n.read).length;

  // Optimistic update
  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  dispatch(clearUnread());
  setMarkingAll(true);

  try {
    await api.patch("/api/notifications/read");
    // Server confirms → optimistic state is already correct, nothing to do
  } catch (err) {
    console.error("Failed to mark all as read", err);
    // Restore exactly what was there before — not a blanket read: false
    setNotifications(previousNotifications);
    dispatch(setUnreadCount(previousUnreadCount));
  } finally {
    setMarkingAll(false);
  }
}, [notifications, markingAll, dispatch]);

  // Mark a single notification as read then navigate
  const handleClick = useCallback(
    async (n) => {
      if (!n.read) {
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === n._id ? { ...item, read: true } : item,
          ),
        );
        dispatch(decrementUnread());

        try {
          await api.patch(`/api/${n._id}/read`);
        } catch (err) {
          console.error("Failed to mark notification read", err);
          setNotifications((prev) =>
            prev.map((item) =>
              item._id === n._id ? { ...item, read: false } : item,
            ),
          );
          dispatch(decrementUnread());
        }
      }

      switch (n.type) {
        case "message":
        case "share":
          navigate(
            n.conversationId
              ? `/Conversations/${n.conversationId}`
              : "/Conversations",
          );
          break;
        case "like":
          if (n.post?._id) navigate(`/post/${n.post._id}`);
          break;
        case "comment":
          if (n.post?._id)
            navigate(`/post/${n.post._id}`, { state: { openCommentModal: true } });
          break;
        case "comment_reply":
          if (n.post?._id)
            navigate(`/post/${n.post._id}`, {
              state: { openCommentModal: true, scrollToCommentId: n.comment?._id },
            });
          break;
        case "comment_like":
          if (n.post?._id)
            navigate(`/post/${n.post._id}`, {
              state: { openCommentModal: true, highlightCommentId: n.comment?._id },
            });
          break;
        case "follow":
          navigate(`/profile/${n.sender?._id}`);
          break;
        default:
          if (n.post?._id) navigate(`/post/${n.post._id}`);
          break;
      }
    },
    [navigate, dispatch],
  );

  const typeLabel = (type) => {
    const labels = {
      like: "liked your post",
      comment: "commented on your post",
      comment_like: "liked your comment",
      comment_reply: "replied to your comment",
      follow: "started following you",
      message: "sent you a message",
      share: "shared your post",
    };
    return labels[type] || type;
  };

  const hasUnread = notifications.some((n) => !n.read);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-warning" role="status" />
      </div>
    );
  }

  return (
    <div className="notif-page container py-4">
      {/* Header row */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h5 className="notif-page__title mb-0">Notifications</h5>
        {hasUnread && (
          <button
            className="btn btn-sm btn-outline-warning rounded-3"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                />
                Marking…
              </>
            ) : (
              "Mark all as read"
            )}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-secondary">No notifications yet.</p>
        </div>
      ) : (
        <ul className="list-unstyled">
          {notifications.map((n) => (
            <li
              key={n._id}
              className={`notif-item d-flex align-items-center p-3 mb-2 rounded-4${
                !n.read ? " border-start border-warning border-4" : " border"
              }`}
              style={{
                transition: "all 0.3s ease",
                cursor: "pointer",
                opacity: n.read ? 0.75 : 1,
              }}
              onClick={() => handleClick(n)}
            >
              <img
                src={n.sender?.profilePicture || "/default-avatar.png"}
                alt={n.sender?.username}
                className="rounded-circle me-3"
                style={{ width: "45px", height: "45px", objectFit: "cover" }}
              />
              <div className="flex-grow-1">
                <span className="fw-bold">{n.sender?.username}</span>{" "}
                <span className="text-secondary">{typeLabel(n.type)}</span>
                <div className="text-muted small">
                  {new Date(n.createdAt).toLocaleDateString()}
                </div>
              </div>
              {!n.read && (
                <span
                  className="ms-2 rounded-circle bg-warning"
                  style={{ width: 10, height: 10, flexShrink: 0, display: "inline-block" }}
                />
              )}
              {n.post?.media?.[0] && (
                <img
                  src={n.post.media[0].thumbnail || n.post.media[0].url}
                  alt="post"
                  className="rounded-3 ms-2"
                  style={{ width: "50px", height: "50px", objectFit: "cover" }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
