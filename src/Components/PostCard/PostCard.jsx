import React, { useEffect, useRef, useState, memo, useCallback } from "react";
import { FiMoreHorizontal, FiEdit2, FiTrash2, FiFlag, FiUser } from "react-icons/fi";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Card, Carousel, Dropdown, Spinner, Button } from "react-bootstrap";
import { api } from "../../utils/api";
import CommentModal from "../CommentModal/CommentModal";
import { usePostRoom } from "../../Hooks/usePostRoom";
import Actions from "../Actions/Actions";
import Caption from "../Caption/Caption";
import ShareToMessageModal from "../ShareToMessageModal/ShareToMessageModal";
import AvatarImg from "../AvatarImage/AvatarImg";
import { updateFeedFollowState } from "../../Store/feedSlice/feedSlice";
import { updateReelsFollowState } from "../../Store/reelsSlice/reelsSlice";
import { useDispatch } from "react-redux";


const PostCard = ({ post, currentUser, onDelete, theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const [liked, setLiked] = useState(post.isLikedByMe || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false); //Caption expand 

  // Follow state 
  const [isFollowing, setIsFollowing] = useState(post.isFollowing || false);
  const [followLoading, setFollowLoading] = useState(false);
  
  
  const videoRef = useRef(null);
  const { socket, isConnected } = usePostRoom(post._id);

  const isOwner = currentUser?._id === (post.user?._id ?? post.user);
  const { openCommentModal, scrollToCommentId, highlightCommentId } = location.state || {};

  const LIMIT = 50;
  const content = post.content ?? "";
  const isTruncated = content.length > LIMIT;
  const displayText = expanded || !isTruncated ? content : content.slice(0, LIMIT) + "…";

  useEffect(() => {
    if (openCommentModal) setShowModal(true);
  }, [openCommentModal]);

  useEffect(() => {
    setLiked(post.isLikedByMe || false);
  }, [post.isLikedByMe]);

  useEffect(() => {
    if (typeof post.likesCount === 'number') setLikesCount(post.likesCount);
    if (typeof post.commentsCount === 'number') setCommentsCount(post.commentsCount);
  }, [post.likesCount, post.commentsCount, post._id]);

  // Sync follow state if the post prop is refreshed from outside
  useEffect(() => {
    setIsFollowing(post.isFollowing || false);
  }, [post.isFollowing]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleLike = ({ postId, likesCount: n }) => {
      if (postId?.toString() === post._id?.toString() && n !== undefined) setLikesCount(n);
    };
    const handleComment = ({ postId: pid }) => {
      if (pid?.toString() === post._id?.toString()) setCommentsCount((p) => p + 1);
    };
    const handleShare = () => {
      // for future local state use if needed.
    };
    // Keep follow state in sync across tabs / other cards for the same author
    const handleFollowState = ({ userId, isFollowedByMe }) => {
      if (userId?.toString() === post.user?._id?.toString()) {
        setIsFollowing(isFollowedByMe);
      }
    };

    socket.on("feed:post_updated", handleLike);
    socket.on("comment:created", handleComment);
    socket.on("post:share_update", handleShare);
    socket.on("follow_state_updated", handleFollowState);
    return () => {
      socket.off("feed:post_updated", handleLike);
      socket.off("comment:created", handleComment);
      socket.off("post:share_update", handleShare);
      socket.off("follow_state_updated", handleFollowState);
    };
  }, [socket, isConnected, post._id, post.user?._id]);

  const handleLike = useCallback(async () => {
    if (likeLoading) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((p) => (newLiked ? p + 1 : Math.max(0, p - 1)));
    setLikeLoading(true);
    try {
      const { data } = await api.post(`/api/posts/${post._id}/like`);
      setLikesCount(data.likesCount);
    } catch {
      setLiked(!newLiked);
      setLikesCount((p) => (!newLiked ? p + 1 : Math.max(0, p - 1)));
    } finally {
      setLikeLoading(false);
    }
  }, [liked, likeLoading, post._id]);

  const handleShare = useCallback(() => setShowShareModal(true), []);

  const handleDelete = useCallback(async () => {
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await api.delete(`/api/posts/${post._id}`);
      onDelete?.(post._id);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    } finally {
      setDeleting(false);
    }
  }, [post._id, onDelete]);

  // Follow handler 
  const handleFollow = useCallback(async () => {
    if (followLoading) return;
    setFollowLoading(true);
    // Optimistic update — button disappears immediately on follow
    setIsFollowing(true);
    dispatch(updateFeedFollowState({ userId: post.user?._id, isFollowing: true }));
    dispatch(updateReelsFollowState({ userId: post.user?._id, isFollowing: true }));
    try {
      await api.post(`/api/users/${post.user?._id}/follow`);
    } catch (err) {
      // Revert on failure
      setIsFollowing(false);
      console.error(err.response?.data?.message || err.message);
    } finally {
      setFollowLoading(false);
    }
  }, [followLoading, post.user?._id, dispatch]);
  

  const media = post.media ?? [];

  return (
    <>
      <Card className="post-card bg-body-secondary rounded-4" style={{ contain: "content", willChange: "transform" }}>
        <div className="post-card__header">
          <Link to={`/profile/${post.user?._id}`} className="post-card__user">
            <AvatarImg src={post.user?.profilePicture} alt={post.user?.username} className="post-card__avatar" />
            <span className="post-card__username">{post.user?.username}</span>
          </Link>

          {/* Follow button — only for other users you don't follow yet */}
          {!isOwner && !isFollowing && (
            <Button
              size="sm"
              variant="primary"
              className="rounded-pill px-3 py-0 ms-2"
              style={{ fontSize: "0.75rem", height: 28 }}
              disabled={followLoading}
              onClick={handleFollow}
            >
              {followLoading ? <Spinner animation="border" size="sm" /> : "Follow"}
            </Button>
          )}

          <Dropdown align="end" className="ms-auto">
            <Dropdown.Toggle as="button" className="post-card__more-btn" disabled={deleting}>
              {deleting ? <Spinner animation="border" size="sm" /> : <FiMoreHorizontal size={20} />}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {isOwner ? (
                <>
                  <Dropdown.Item onClick={() => navigate(`/posts/edit/${post._id}`)}>
                    <FiEdit2 className="me-2" /> Edit Post
                  </Dropdown.Item>
                  <Dropdown.Item className="text-danger" onClick={handleDelete}>
                    <FiTrash2 className="me-2" /> Delete Post
                  </Dropdown.Item>
                </>
              ) : (
                <Dropdown.Item onClick={() => navigate(`/report/post/${post._id}`)}>
                  <FiFlag className="me-2" /> Report Post
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {media.length > 0 ? (
          <>
            {media.length > 1 ? (
              <Carousel className={`post-card__carousel ${theme === "light" ? "bg-light" : "bg-dark"}`} interval={null} data-bs-theme={theme === "light" ? "dark" : "light"}>
                {media.map((m, i) => (
                  <Carousel.Item key={i}>
                    {m.type === "video" ? (
                      <video src={m.url} poster={m.thumbnail} controls className="post-card__video" playsInline preload="none" />
                    ) : (
                      <img src={m.url} alt={`media-${i}`} className="post-card__image" loading="lazy" decoding="async" />
                    )}
                  </Carousel.Item>
                ))}
              </Carousel>
            ) : (
              <div className={`post-card__media ${theme === "light" ? "bg-light" : "bg-dark"}`}>
                {media[0].type === "video" ? (
                  <video ref={videoRef} src={media[0].url} poster={media[0].thumbnail} controls className="post-card__video" playsInline preload="none" />
                ) : (
                  <img src={media[0].url} alt="post" className="post-card__image" loading="lazy" decoding="async" />
                )}
              </div>
            )}
          </>
        ) : (
          <div className="post-card__caption pt-2">
            <Caption user={post.user} text={displayText} isTruncated={isTruncated} expanded={expanded} onToggle={() => setExpanded((v) => !v)} hashtags={post.hashtags} />
          </div>
        )}

        <Actions
          liked={liked}
          likesCount={likesCount}
          commentsCount={commentsCount}
          sharesCount={post.sharesCount || 0}
          likeLoading={likeLoading}
          onLike={handleLike}
          onComment={() => setShowModal(true)}
          onShare={handleShare}
        />

        {media.length > 0 && (content || post.hashtags?.length > 0) && (
          <div className="post-card__caption">
            <Caption user={post.user} text={displayText} isTruncated={isTruncated} expanded={expanded} onToggle={() => setExpanded((v) => !v)} hashtags={post.hashtags} />
          </div>
        )}
      </Card>

      {showModal && (
        <CommentModal
          post={{ ...post, isLikedByMe: liked, likesCount, commentsCount }}
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onLike={handleLike}
          onShare={handleShare}
          scrollToCommentId={scrollToCommentId}
          highlightCommentId={highlightCommentId}
        />
      )}

      {showShareModal && (
        <ShareToMessageModal postId={post._id} onClose={() => setShowShareModal(false)} currentUser={currentUser} />
      )}
    </>
  );
};

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.post._id === nextProps.post._id &&
    prevProps.post.likesCount === nextProps.post.likesCount &&
    prevProps.post.commentsCount === nextProps.post.commentsCount &&
    prevProps.post.isLikedByMe === nextProps.post.isLikedByMe &&
    prevProps.post.sharesCount === nextProps.post.sharesCount &&
    prevProps.post.isFollowing === nextProps.post.isFollowing &&
    prevProps.theme === nextProps.theme &&
    prevProps.currentUser?._id === nextProps.currentUser?._id
  );
};

export default memo(PostCard, areEqual);
