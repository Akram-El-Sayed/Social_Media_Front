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
import {
  FiArrowLeft,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { api } from "../../utils/api"; 
import FollowingUserRow from "../../Components/FollowingUserRow/FollowingUserRow";

export default function Following() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [unfollowedSet, setUnfollowedSet] = useState(new Set());
  const [pendingUnfollow, setPendingUnfollow] = useState(new Set());

  const loaderRef = useRef(null);

  const fetchFollowing = useCallback(
    async (cursor = null) => {
      try {
        if (!cursor) setLoading(true);
        else setMoreLoading(true);

        const { data } = await api.get(`/api/users/${id}/following`, { params: { limit: 20, ...(cursor && { cursor }) } });

        if (!cursor) {
          setFollowing(data.following);
        } else {
          setFollowing((prev) => [...prev, ...data.following]);
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
    [id]
  );

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !moreLoading) {
          fetchFollowing(nextCursor);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasNextPage, moreLoading, nextCursor, fetchFollowing]);

  const handleUnfollow = async (userId) => {
    if (pendingUnfollow.has(userId)) return;
    setPendingUnfollow((s) => new Set(s).add(userId));
    try {
      await api.delete(`/api/users/${userId}/unfollow`);
      setUnfollowedSet((s) => new Set(s).add(userId));
    } catch (err) {
      console.error(err.message);
    } finally {
      setPendingUnfollow((s) => {
        const next = new Set(s);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleRefollow = async (userId) => {
    if (pendingUnfollow.has(userId)) return;
    setPendingUnfollow((s) => new Set(s).add(userId));
    try {
      await api.post(`/api/users/${userId}/follow`);
      setUnfollowedSet((s) => {
        const next = new Set(s);
        next.delete(userId);
        return next;
      });
    } catch (err) {
      console.error(err.message);
    } finally {
      setPendingUnfollow((s) => {
        const next = new Set(s);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <Container className="px-0" style={{ maxWidth: 600 }}>
      {/* Sticky Header */}
      <div className="d-flex align-items-center gap-3 px-3 py-3  sticky-top fol-btn-top  bg-body border-bottom" >
        <Button
          variant="outline-secondary"
          size="sm"
          className="rounded-circle p-1 lh-1 "
          onClick={() => navigate(-1)}
          aria-label="Go back"
         
        >
          <FiArrowLeft size={18} />
        </Button>
        <h5 className="mb-0 fw-semibold">Following</h5>
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
      {!loading && !error && following.length === 0 && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted gap-2">
          <FiUsers size={40} className="opacity-25" />
          <p className="mb-0 fst-italic">Not following anyone yet.</p>
        </div>
      )}

      {/* List */}
      {!loading && !error && following.length > 0 && (
        <ListGroup variant="flush">
          {following.map((user) => (
            <FollowingUserRow
              key={user._id}
              user={user}
              isUnfollowed={unfollowedSet.has(user._id)}
              isPending={pendingUnfollow.has(user._id)}
              onUnfollow={() => handleUnfollow(user._id)}
              onRefollow={() => handleRefollow(user._id)}
              navigate={navigate}
            />
          ))}
        </ListGroup>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="d-flex justify-content-center py-4">
        {moreLoading && <Spinner animation="border" size="sm" variant="secondary" />}
      </div>
    </Container>
  );
}


