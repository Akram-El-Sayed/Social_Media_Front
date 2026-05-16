import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Caption({ user, text, isTruncated, expanded, onToggle, hashtags }) {
  const navigate = useNavigate()
  return (
     <>
      {text && (
        <p className="mb-1">
          <strong  onClick={()=>{navigate(`/profile/${user?._id}`)}} style={{cursor: 'pointer'}}>{user?.username}</strong>{" "}{text}
          {isTruncated && (
            <button className="post-card__show-more ms-1" onClick={onToggle}>
              {expanded ? " show less" : " more"}
            </button>
          )}
        </p>
      )}
      {hashtags?.length > 0 && (
        <div className="post-card__hashtags">
          {hashtags.map((tag) => (
            <Link key={tag} to={`/hashtag/${tag}`} className="post-card__tag">#{tag}</Link>
          ))}
        </div>
      )}
    </>
  )
}

