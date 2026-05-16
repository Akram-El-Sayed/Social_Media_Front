import React from 'react'
import { Button, Image, ListGroup, Spinner } from 'react-bootstrap'
import { FiArrowLeft, FiUser, FiUsers } from "react-icons/fi";

export default function FollowingUserRow({ user, isUnfollowed, isPending, onUnfollow, onRefollow, navigate }) {
  return (
     <ListGroup.Item
      className={`d-flex align-items-center justify-content-between gap-3 px-3 py-2 border-bottom${isUnfollowed ? " opacity-50" : ""}`}
      style={{ cursor: "default" }}
    >
      {/* Avatar + Info */}
      <div
        className="d-flex align-items-center gap-3 flex-grow-1 overflow-hidden"
        style={{ cursor: "pointer" }}
        onClick={() => navigate(`/profile/${user._id}`)}
      >
        {user.profilePicture ? (
          <Image
            src={user.profilePicture}
            alt={user.username}
            roundedCircle
            width={46}
            height={46}
            style={{ objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div
            className="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center text-secondary"
            style={{ width: 46, height: 46, flexShrink: 0 }}
          >
            <FiUser size={20} />
          </div>
        )}

        <div className="overflow-hidden">
          <div className="fw-medium text-truncate small">@{user.username}</div>
          {user.bio && (
            <div className="text-muted text-truncate" style={{ fontSize: "0.75rem" }}>
              {user.bio}
            </div>
          )}
        </div>
      </div>

      {/* Follow / Unfollow Button */}
      {isUnfollowed ? (
        <Button
          variant="primary"
          size="sm"
          className="rounded-pill px-3 flex-shrink-0"
          onClick={onRefollow}
          disabled={isPending}
        >
          {isPending ? (
            <Spinner animation="border" size="sm" />
          ) : (
            "Follow"
          )}
        </Button>
      ) : (
        <Button
          variant="outline-secondary"
          size="sm"
          className="rounded-pill px-3 flex-shrink-0"
          onClick={onUnfollow}
          disabled={isPending}
        >
          {isPending ? (
            <Spinner animation="border" size="sm" />
          ) : (
            "Following"
          )}
        </Button>
      )}
    </ListGroup.Item>
  )
}
