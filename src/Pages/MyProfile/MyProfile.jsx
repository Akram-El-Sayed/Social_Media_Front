import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Spinner,
  Modal,
  Form,
} from "react-bootstrap";
import { useSocket } from "../../Hooks/useSocket";
import { api } from "../../utils/api";
import { useSelector } from "react-redux";
import { Loading } from "../../Components/Loading/Loading";
import ProfilePostCard from "../../Components/ProfilePostsCard/ProfilePostCard";
import {
  FiArrowLeft,
  FiUser,
  FiGlobe,
  FiUsers,
  FiLock,
  FiHeart,
  FiMessageCircle,
  FiEdit2,
} from "react-icons/fi";

function Avatar({ src, size = 96 }) {
  return src ? (
    <img
      src={src}
      alt="avatar"
      className="up-avatar"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="up-avatar-placeholder"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      ◈
    </div>
  );
}

export default function MyProfile({theme}) {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { userInfo } = useSelector((state) => state.user);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const loaderRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchProfile = useCallback(async (cursor = null) => {
    try {
      if (!cursor) setLoading(true);
      else setPostsLoading(true);

      const params = { limit: 9 };
      if (cursor) params.cursor = cursor;

      const { data } = await api.get(`/api/posts/user/${userInfo._id}/posts`, {
        params,
      });

      console.log(data);

      if (!cursor) {
        setUser(data.user);
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }

      setNextCursor(data.pagination.nextCursor);
      setHasNextPage(data.pagination.hasNextPage);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
      setPostsLoading(false);
    }
  }, [userInfo?._id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !postsLoading)
          fetchProfile(nextCursor);
      },
      { threshold: 0.1 },
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasNextPage, postsLoading, nextCursor, fetchProfile]);

  // Socket: live count updates
  useEffect(() => {
    if (!socket) return;
    const handleFollowers = ({ followersCount }) =>
      setUser((u) => (u ? { ...u, followersCount } : u));
    const handleFollowing = ({ followingCount }) =>
      setUser((u) => (u ? { ...u, followingCount } : u));
    socket.on("followers_count_updated", handleFollowers);
    socket.on("following_count_updated", handleFollowing);
    return () => {
      socket.off("followers_count_updated", handleFollowers);
      socket.off("following_count_updated", handleFollowing);
    };
  }, [socket]);

  const openEdit = () => {
    setEditBio(user?.bio || "");
    setEditFile(null);
    setEditPreview(null);
    setSaveError(null);
    setEditOpen(true);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setEditFile(f);
    setEditPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const fd = new FormData();
      fd.append("bio", editBio);
      if (editFile) fd.append("profilePicture", editFile);

      const { data } = await api.put("/api/users/profile", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser(data.user);
      setEditOpen(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (error)
    return (
      <div className="up-page-loader">
        <p className="up-error">{error}</p>
      </div>
    );

  return (
    <>
      <div className="min-vh-100  text-light">
        {/* ── Hero ── */}
        <div className="py-5 border-bottom border-secondary">
          <Container>
            <div className="d-flex flex-column align-items-center gap-3 text-center ">
              <img src={user?.profilePicture}  className=' profile-avatar ' />

              <div>
                <h1 className="h3 fw-semibold text-light mb-1">
                  @{user?.username}
                </h1>
                <p className="text-secondary small mb-0">
                  {user?.bio || <em>No bio yet.</em>}
                </p>
              </div>

              {/* Stats */}
              <div className="d-flex align-items-center gap-4">
                <Link
                  to={`/followers/${user?._id}`}
                  className="text-decoration-none text-center"
                >
                  <div className="text-warning fw-semibold fs-5">
                    {user?.followersCount ?? 0}
                  </div>
                  <div
                    className="text-secondary text-uppercase"
                    style={{ fontSize: ".68rem", letterSpacing: ".1em" }}
                  >
                    Followers
                  </div>
                </Link>
                <div
                  className="vr bg-secondary opacity-50"
                  style={{ height: 32 }}
                />
                <Link
                  to={`/following/${user?._id}`}
                  className="text-decoration-none text-center"
                >
                  <div className="text-warning fw-semibold fs-5">
                    {user?.followingCount ?? 0}
                  </div>
                  <div
                    className="text-secondary text-uppercase"
                    style={{ fontSize: ".68rem", letterSpacing: ".1em" }}
                  >
                    Following
                  </div>
                </Link>
                <div
                  className="vr bg-secondary opacity-50"
                  style={{ height: 32 }}
                />
                <div className="text-center">
                  <div className="text-warning fw-semibold fs-5">
                    {posts.length}
                    {hasNextPage ? "+" : ""}
                  </div>
                  <div
                    className="text-secondary text-uppercase"
                    style={{ fontSize: ".68rem", letterSpacing: ".1em" }}
                  >
                    Posts
                  </div>
                </div>
              </div>

              <Button
                variant="outline-warning"
                size="sm"
                className="rounded-pill px-4"
                onClick={openEdit}
              >
                <FiEdit2 size={14} /> Edit Profile
              </Button>
            </div>
          </Container>
        </div>

        {/* ── Posts ── */}
        <Container className="py-4" style={{ maxWidth: 900 }}>
          <div className="d-flex align-items-center gap-3 mb-4">
            <hr className="flex-grow-1 border-secondary opacity-25 m-0" />
            <span
              className="text-secondary small text-uppercase"
              style={{ letterSpacing: ".15em" }}
            >
              Posts
            </span>
            <hr className="flex-grow-1 border-secondary opacity-25 m-0" />
          </div>

          {posts.length === 0 ? (
            <p className="text-center text-secondary fst-italic py-5">
              No posts yet. Share something.
            </p>
          ) : (
            <Row xs={3} sm={3} lg={4} className="g-3">
              {posts.map((post, i) => (
                <Col key={post._id}>
                  <div
                    onClick={() => navigate(`/post/${post._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <ProfilePostCard post={post} user={userInfo} theme={theme} index={i} />
                  </div>
                </Col>
              ))}
            </Row>
          )}

          <div
            ref={loaderRef}
            className="d-flex justify-content-center pt-4"
            style={{ minHeight: 40 }}
          >
            {postsLoading && (
              <Spinner animation="border" size="sm" variant="warning" />
            )}
          </div>
        </Container>

        {/* ── Edit Modal ── */}
        <Modal
          show={editOpen}
          onHide={() => setEditOpen(false)}
          centered
          
        >
          <Modal.Header closeButton className="border-secondary">
            <Modal.Title className="fw-semibold fs-5">Edit Profile</Modal.Title>
          </Modal.Header>

          <Modal.Body >
            {/* Avatar picker */}
            <div
              className="position-relative mx-auto mb-4"
              style={{ width: 80, cursor: "pointer" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <img src={editPreview || user?.profilePicture} className="edite-profile-avatar" />
              <div className="avatar-change-overlay rounded-circle position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center ms-2">
                <small className=" text-primary">Change</small>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="d-none"
              onChange={handleFileChange}
            />

            <Form.Group>
              <Form.Label
                className="text-secondary small text-uppercase"
                style={{ letterSpacing: ".08em" }}
              >
                Bio
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={200}
                placeholder="Tell people about yourself…"
                className=" border-secondary"
                style={{ resize: "vertical" }}
              />
              <div
                className="text-end text-secondary mt-1"
                style={{ fontSize: ".7rem" }}
              >
                {editBio.length}/200
              </div>
            </Form.Group>

            {saveError && (
              <p className="text-danger small mt-2 mb-0">{saveError}</p>
            )}
          </Modal.Body>

          <Modal.Footer className="border-secondary ">
            <Button
              variant="warning"
              className="w-100 fw-medium"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}
