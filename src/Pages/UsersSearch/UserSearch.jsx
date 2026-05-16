import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Spinner, Card } from "react-bootstrap";
import { FiUser } from "react-icons/fi";
import { api } from "../../utils/api";
import { useSocket } from "../../Hooks/useSocket";

export default function UserSearch() {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [followLoading, setFollowLoading] = useState(null);

  const loaderRef = useRef(null);


  const fetchUsers = useCallback(
    async (cursor = null, reset = false) => {
      try {
        setLoading(true);

        const params = { limit: 20 };
        if (cursor) params.cursor = cursor;
        if (search.trim()) params.search = search.trim();

        const { data } = await api.get("/api/users/users", { params });

        if (reset) {
          setUsers(data.users);
        } else {
          setUsers((prev) => [...prev, ...data.users]);
        }

        setNextCursor(data.pagination.nextCursor);
        setHasNextPage(data.pagination.hasNextPage);
      } catch (err) {
        console.error(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  // Initial load + search change
  useEffect(() => {
    fetchUsers(null, true);
  }, [fetchUsers]);

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current || search.trim()) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !loading) {
          fetchUsers(nextCursor);
        }
      },
      { threshold: 0.1 }
    );

    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasNextPage, loading, nextCursor, fetchUsers, search]);

  
  useEffect(() => {
    if (!socket) return;

    const handleFollowStateUpdate = ({ userId, isFollowedByMe }) => {
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId
            ? { ...user, isFollowedByMe }
            : user
        )
      );
    };

    socket.on("follow_state_updated", handleFollowStateUpdate);

    return () => {
      socket.off("follow_state_updated", handleFollowStateUpdate);
    };
  }, [socket]);

  
  const handleFollow = async (userId, isFollowed) => {
    if (followLoading) return;
    setFollowLoading(userId);

    try {
      // Optimistic update (instant UI)
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, isFollowedByMe: !isFollowed }
            : u
        )
      );

      if (isFollowed) {
        await api.delete(`/api/users/${userId}/unfollow`);
      } else {
        await api.post(`/api/users/${userId}/follow`);
      }

    } catch (err) {
      console.error(err.response?.data?.message || err.message);

      // Revert on error
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, isFollowedByMe: isFollowed }
            : u
        )
      );
    } finally {
      setFollowLoading(null);
    }
  };

  return (
    <div className="p-4" style={{ maxWidth: 700, margin: "0 auto" }}>
      {/* Search */}
      <Form.Control
        placeholder="Search users..."
        className="mb-4 rounded-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Users */}
      {users.length === 0 && !loading ? (
        <p className="text-center text-muted">No users found.</p>
      ) : (
        users.map((user) => (
          <Card
            key={user._id}
            className="mb-3 p-3 d-flex flex-row align-items-center rounded-4 justify-content-between"
          >
            <div
              className="d-flex align-items-center w-100 gap-3"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/profile/${user._id}`)}
            >
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  width={45}
                  height={45}
                  style={{ borderRadius: "50%", objectFit: "cover" , border: '3px groove #4dffbe' }}
                />
              ) : (
                <div
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: "50%",
                    border: '3px groove #4dffbe',
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiUser />
                </div>
              )}

              <div>
                <div className="fw-semibold">@{user.username}</div>
                <div className="text-muted small">{user.fullName}</div>
                {user.bio && (
                  <div className="text-muted small">{user.bio}</div>
                )}
              </div>
            </div>

            <Button
              size="sm"
              variant={user.isFollowedByMe ? "outline-secondary" : "primary"}
              className=" rounded-4"
              disabled={followLoading === user._id}
              onClick={() =>
                handleFollow(user._id, user.isFollowedByMe)
              }
            >
              {followLoading === user._id ? (
                <Spinner size="sm" />
              ) : user.isFollowedByMe ? (
                "Following"
              ) : (
                "Follow"
              )}
            </Button>
          </Card>
        ))
      )}

      {/* Loader */}
      <div
        ref={loaderRef}
        className="d-flex justify-content-center pt-3"
        style={{ minHeight: 40 }}
      >
        {loading && <Spinner size="sm" />}
      </div>
    </div>
  );
}