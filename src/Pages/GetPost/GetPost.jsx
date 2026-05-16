import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Spinner, Alert, Button } from "react-bootstrap";
import { FiArrowLeft } from "react-icons/fi";
import { api } from "../../utils/api";
import PostCard from "../../Components/PostCard/PostCard";
import { useSelector } from "react-redux";

export default function GetPost({ theme }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {userInfo} = useSelector((state)=> state.user)
  const currentUser = userInfo

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/api/posts/${id}`);
      setPost(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load post.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return (
    <Container className="py-4" style={{ maxWidth: 600 }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button
          variant="outline-secondary"
          size="sm"
          className="rounded-circle p-1 lh-1"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <FiArrowLeft size={18} />
        </Button>
        <h5 className="mb-0 fw-semibold">Post</h5>
      </div>

      {/* Loading */}
      {loading && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="secondary" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Alert variant="danger" className="d-flex align-items-center justify-content-between">
          <span>{error}</span>
          <Button variant="outline-danger" size="sm" onClick={fetchPost}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Post */}
      {!loading && !error && post && (
        <PostCard post={post} currentUser={currentUser} theme={theme} />
      )}
    </Container>
  );
}
