import React from 'react'
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

export default function CommentRow({ comment, onReply, onLike, isReply = false }) {
  const navigate = useNavigate();

  return (
    <div className={`cm-comment${isReply ? " cm-comment--reply" : ""}`}>
      <img
        src={comment.user?.profilePicture || "/default-avatar.png"}
        alt={comment.user?.username}
        className="cm-comment-avatar"
        onClick={() => navigate(`/profile/${comment.user?._id}`)}
        style={{ cursor: "pointer" }}
      />
      <div className="cm-comment-body">
        <p className="cm-comment-text">
          <span
            className="cm-comment-username"
            onClick={() => navigate(`/profile/${comment.user?._id}`)}
            style={{ cursor: "pointer" }}
          >
            {comment.user?.username}
          </span>{" "}
          {comment.text}
        </p>
        <div className="cm-comment-meta">
          <button
            className={`cm-comment-like-btn${comment.isLikedByMe ? " cm-comment-like-btn--active" : ""}`}
            onClick={() => onLike(comment._id)}
          >
            {comment.isLikedByMe ? <FaHeart /> : <FaRegHeart />}
            {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
          </button>
          {!isReply && (
            <button className="cm-comment-reply-btn" onClick={() => onReply(comment)}>
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}