import React from 'react'
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { FaRegComment } from "react-icons/fa6";
import { PiShareFatLight } from "react-icons/pi";

const Actions = React.memo(function Actions({ liked, likesCount, commentsCount, sharesCount, likeLoading, onLike, onComment, onShare }) {
  return (
    <div className="post-card__actions">
      <button className={`post-card__btn${liked ? " post-card__btn--liked" : ""}`} onClick={onLike} disabled={likeLoading}>
        {liked ? <FaHeart /> : <FaRegHeart />}<span>{likesCount}</span>
      </button>
      <button className="post-card__btn" onClick={onComment}>
        <FaRegComment /><span>{commentsCount}</span>
      </button>
      <button className="post-card__btn" onClick={onShare}>
        <PiShareFatLight /><span>{sharesCount || 0}</span>
      </button>
    </div>
  );
});

export default Actions;
