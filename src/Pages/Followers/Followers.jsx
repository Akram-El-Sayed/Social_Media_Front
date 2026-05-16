import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  ListGroup,
  Button,
  Spinner,
  Alert,
  Image,
} from "react-bootstrap";
import { FiArrowLeft, FiUser, FiUsers } from "react-icons/fi";
import { api } from "../../utils/api";
import UserRow from "../../Components/UserRow/UserRow";

export default function Followers() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [followingSet, setFollowingSet] = useState(new Set());
  const [pendingFollow, setPendingFollow] = useState(new Set());

  const loaderRef = useRef(null);

  const fetchFollowers = useCallback(
    async (cursor = null) => {
      try {
        if (!cursor) setLoading(true);
        else setMoreLoading(true);

        const { data } = await api.get(`/api/users/${id}/followers`, {
          params: { limit: 20, ...(cursor && { cursor }) },
        });

        if (!cursor) {
          setFollowers(data.followers);
        } else {
          setFollowers((prev) => [...prev, ...data.followers]);
        }

        setNextCursor(data.pagination.nextCursor);
        setHasNextPage(data.pagination.hasNextPage);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setMoreLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !moreLoading) {
          fetchFollowers(nextCursor);
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasNextPage, moreLoading, nextCursor, fetchFollowers]);

  const handleFollowToggle = async (userId) => {
    if (pendingFollow.has(userId)) return;

    setPendingFollow((s) => new Set(s).add(userId));
    const alreadyFollowing = followingSet.has(userId);

    try {
      if (alreadyFollowing) {
        await api.delete(`/api/users/${userId}/unfollow`);
      } else {
        await api.post(`/api/users/${userId}/follow`);
      }

      setFollowingSet((s) => {
        const next = new Set(s);
        alreadyFollowing ? next.delete(userId) : next.add(userId);
        return next;
      });
    } catch (err) {
      console.error(err.message);
    } finally {
      setPendingFollow((s) => {
        const next = new Set(s);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <Container className="px-0" style={{ maxWidth: 600 }}>
      {/* Sticky Header */}
      <div className="d-flex align-items-center gap-3 px-3 py-3 fol-btn-top sticky-top bg-body border-bottom">
        <Button
          variant="outline-secondary"
          size="sm"
          className="rounded-circle p-1 lh-1"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <FiArrowLeft size={18} />
        </Button>
        <h5 className="mb-0 fw-semibold">Followers</h5>
      </div>

      {/* Loading */}
      {loading && (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" variant="secondary" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Alert variant="danger" className="m-3">
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && !error && followers.length === 0 && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted gap-2">
          <FiUsers size={40} className="opacity-25" />
          <p className="mb-0 fst-italic">No followers yet.</p>
        </div>
      )}

      {/* List */}
      {!loading && !error && followers.length > 0 && (
        <ListGroup variant="flush">
          {followers.map((user) => (
            <UserRow
              key={user._id}
              user={user}
              isFollowing={user.isFollowing}
              isPending={pendingFollow.has(user._id)}
              onToggle={() => handleFollowToggle(user._id)}
              navigate={navigate}
            />
          ))}
        </ListGroup>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="d-flex justify-content-center py-4">
        {moreLoading && (
          <Spinner animation="border" size="sm" variant="secondary" />
        )}
      </div>
    </Container>
  );
}
