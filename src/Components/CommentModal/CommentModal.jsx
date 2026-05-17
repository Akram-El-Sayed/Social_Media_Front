import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { PiShareFatLight } from "react-icons/pi";
import { Modal, Spinner, Form, Button, Carousel } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { api } from "../../utils/api";
import { usePostRoom } from "../../Hooks/usePostRoom";
import CommentRow from "../CommentRow/CommentRow";
import { useNavigate } from "react-router-dom";
import AvatarImg from "../AvatarImage/AvatarImg";
import { useSelector, useDispatch } from "react-redux";
import { updatePost } from "../../Store/feedSlice/feedSlice";
export default function CommentModal({
  post,
  currentUser: currentUserProp,
  onClose,
  onLike,
  onShare,
  scrollToCommentId,
  highlightCommentId,
}) {
  const renderMediaItem = (m, index = 0) => {
    if (m.type === "video") {
      return (
        <video
          src={m.url}
          poster={m.thumbnail}
          controls
          autoPlay
          muted
          className="cm-media"
          playsInline
        />
      );
    }
    return <img src={m.url} alt={`media-${index}`} className="cm-media" />;
  };

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const reduxUser = useSelector((state) => state.user.userInfo);
  const currentUser = reduxUser || currentUserProp;
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const commentsEndRef = useRef(null);
  // Map of comment _id => DOM element ref
  const commentRefsMap = useRef({});
  const navigate = useNavigate();

  const { socket, isConnected } = usePostRoom(post._id);
  const media = post.media ?? [];

  // Load comments
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/api/posts/${post._id}/comments`);
        setComments(data.comments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [post._id]);

  // After comments load, scroll to the target comment
  useEffect(() => {
    if (loading) return;
    const targetId = scrollToCommentId || highlightCommentId;
    if (!targetId) return;

    // Give the DOM a tick to paint the comment rows
    const timer = setTimeout(() => {
      const el = commentRefsMap.current[targetId.toString()];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [loading, scrollToCommentId, highlightCommentId]);

  // Real-time socket events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const onCreated = ({ postId, comment }) => {
      if (postId?.toString() !== post._id?.toString()) return;
      setComments((prev) => {
        if (
          prev.some(
            (comm) =>
              comm._id.toString() === comment._id.toString() ||
              comm.replies?.some(
                (reply) => reply._id.toString() === comment._id.toString(),
              ),
          )
        )
          return prev;
        if (comment.parentComment)
          return prev.map((comm) =>
            comm._id.toString() === comment.parentComment.toString()
              ? { ...comm, replies: [...(comm.replies || []), comment] }
              : comm,
          );
        return [...prev, { ...comment, replies: [] }];
      });
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const onLikeUpdate = ({ commentId, likesCount: n }) => {
      setComments((prev) =>
        prev.map((comm) => ({
          ...(comm._id.toString() === commentId.toString()
            ? { ...comm, likesCount: n }
            : comm),
          replies: comm.replies?.map((reply) =>
            reply._id.toString() === commentId.toString()
              ? { ...reply, likesCount: n }
              : reply,
          ),
        })),
      );
    };

    socket.on("comment:created", onCreated);
    socket.on("comment:like_update", onLikeUpdate);
    return () => {
      socket.off("comment:created", onCreated);
      socket.off("comment:like_update", onLikeUpdate);
    };
  }, [socket, isConnected, post._id]);

  const handleCommentLike = useCallback(async (commentId) => {
    const toggle = (item) =>
      item._id.toString() !== commentId.toString()
        ? item
        : {
            ...item,
            isLikedByMe: !item.isLikedByMe,
            likesCount: !item.isLikedByMe
              ? (item.likesCount || 0) + 1
              : Math.max(0, (item.likesCount || 0) - 1),
          };
    setComments((prev) =>
      prev.map((comm) => ({
        ...toggle(comm),
        replies: comm.replies?.map(toggle),
      })),
    );
    try {
      const { data } = await api.post(`/api/comments/${commentId}/like`);
      setComments((prev) =>
        prev.map((comm) => ({
          ...(comm._id.toString() === commentId.toString()
            ? { ...comm, likesCount: data.likesCount }
            : comm),
          replies: comm.replies?.map((reply) =>
            reply._id.toString() === commentId.toString()
              ? { ...reply, likesCount: data.likesCount }
              : reply,
          ),
        })),
      );
    } catch {
      /* handled by socket */
    }
  }, []);

  const handleStartReply = useCallback((comment) => {
    setReplyingTo({ _id: comment._id, username: comment.user?.username });
    setNewComment(`@${comment.user?.username} `);
    inputRef.current?.focus();
  }, []);

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      if (replyingTo) {
        const { data } = await api.post(
          `/api/comments/${replyingTo._id}/reply`,
          { text: newComment },
        );
        if (!socket || !isConnected)
          setComments((prev) =>
            prev.map((comm) =>
              comm._id.toString() === replyingTo._id.toString()
                ? { ...comm, replies: [...(comm.replies || []), data] }
                : comm,
            ),
          );
        setReplyingTo(null);
      } else {
        const { data } = await api.post(`/api/posts/${post._id}/comments`, {
          text: newComment,
        });
        if (!socket || !isConnected) {
          setComments((prev) => [...prev, { ...data, replies: [] }]);
          commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
      dispatch(updatePost({
      postId: post._id,
      commentsCount: (post.commentsCount || 0) + 1,
    }));
      setNewComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // build a ref callback that stores the element in our map
  const setCommentRef = (id) => (el) => {
    if (id) commentRefsMap.current[id.toString()] = el;
  };

  // decide whether a comment row should glow
  const isHighlighted = (id) => {
    const idStr = id?.toString();
    return (
      idStr === highlightCommentId?.toString() ||
      idStr === scrollToCommentId?.toString()
    );
  };

  return (
    <Modal
      show
      onHide={onClose}
      size="xl"
      className="cm-modal-outer"
      dialogClassName="cm-dialog"
      contentClassName="cm-content"
    >
      {/* Left: comments panel */}
      <div className="cm-left">
        <div className="cm-post-header">
          <AvatarImg src={post.user?.profilePicture} alt={post.user?.username} className="cm-avatar" onClick={() => navigate(`/profile/${post.user?._id}`)} style={{ cursor: "pointer" }} />
          <strong
            className="small"
            onClick={() => navigate(`/profile/${post.user?._id}`)}
            style={{ cursor: "pointer" }}
          >
            {post.user?.username}
          </strong>
          <Button
            variant="link"
            className="ms-auto p-0 text-secondary"
            onClick={onClose}
          >
            <IoClose size={22} />
          </Button>
        </div>

        {post.content && <p className="cm-caption">{post.content}</p>}

        <div className="cm-comments-list">
          {loading ? (
            <div className="cm-state-msg">
              <Spinner animation="border" size="sm" />
            </div>
          ) : comments.length === 0 ? (
            <div className="cm-state-msg">No comments yet. Be the first!</div>
          ) : (
            comments.map((comm) => (
              <div key={comm._id}>
                {/* Top-level comment — attach ref + highlight class if needed */}
                <div
                  ref={setCommentRef(comm._id)}
                  className={isHighlighted(comm._id) ? "comment-highlight" : ""}
                >
                  <CommentRow
                    comment={comm}
                    onReply={handleStartReply}
                    onLike={handleCommentLike}
                  />
                </div>

                {/* Replies */}
                {comm.replies?.map((reply) => (
                  <div
                    key={reply._id}
                    ref={setCommentRef(reply._id)}
                    className={
                      isHighlighted(reply._id) ? "comment-highlight" : ""
                    }
                  >
                    <CommentRow
                      comment={reply}
                      onReply={handleStartReply}
                      onLike={handleCommentLike}
                      isReply
                    />
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Post actions */}
        <div className="cm-actions">
          <button
            className={`cm-btn${post.isLikedByMe ? " cm-btn--liked" : ""}`}
            onClick={onLike}
          >
            {post.isLikedByMe ? <FaHeart /> : <FaRegHeart />}
            <span>{post.likesCount || 0}</span>
          </button>
          <button className="cm-btn" onClick={onShare}>
            <PiShareFatLight />
            <span>{post.sharesCount || 0}</span>
          </button>
        </div>

        {/* Replying-to banner */}
        {replyingTo && (
          <div className="cm-replying-to">
            Replying to <strong>@{replyingTo.username}</strong>
            <button className="cm-cancel-reply" onClick={cancelReply}>
              <IoClose />
            </button>
          </div>
        )}

        {/* Input */}
        <Form className="cm-input-row" onSubmit={handleSubmit}>
         <AvatarImg src={currentUser?.profilePicture} alt="me" className="cm-comment-avatar" />
          <Form.Control
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              replyingTo
                ? `Reply to @${replyingTo.username}…`
                : "Add a comment…"
            }
            className="cm-input border-0 shadow-none bg-transparent"
            maxLength={500}
          />
          <Button
            type="submit"
            variant="link"
            className="cm-post-btn p-0"
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? <Spinner animation="border" size="sm" /> : "Post"}
          </Button>
        </Form>
      </div>

      {/* Right: media (hidden on mobile) */}
      <div className="cm-right">
        {media.length === 0 ? (
          <div className="cm-no-media text-muted small">No media</div>
        ) : media.length === 1 ? (
          renderMediaItem(media[0])
        ) : (
          <Carousel interval={null} className="w-100 h-100">
            {media.map((m, i) => (
              <Carousel.Item key={i} className="h-100">
                <div className="d-flex align-items-center justify-content-center h-100">
                  {renderMediaItem(m, i)}
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        )}
      </div>
    </Modal>
  );
}
