import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import { FiArrowLeft, FiUser, FiMessageCircle, FiEdit2 } from "react-icons/fi";
import { useSocket } from "../../Hooks/useSocket";
import { api } from "../../utils/api";
import ProfilePostCard from "../../Components/ProfilePostsCard/ProfilePostCard";
import { Loading } from "../../Components/Loading/Loading";
import { useOnlineUsers } from "../../Hooks/useOnlineUsers"; 

// Small reusable dot
const OnlineDot = ({ online }) => (
  <span
    title={online ? "Online" : "Offline"}
    style={{
      position: "absolute",
      bottom: 4,
      right: 4,
      width: 14,
      height: 14,
      borderRadius: "50%",
      background: online ? "#22c55e" : "#9ca3af",
      border: "1.5px solid  #fff",
      display: "block",
    }}
  />
);

export default function Profiles({ theme }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const onlineUsers = useOnlineUsers();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);

  const loaderRef = useRef(null);

  // Derived: is the profile user currently online?
  const isOnline = user ? onlineUsers.has(user._id?.toString()) : false;

  const fetchProfile = useCallback(
    async (cursor = null) => {
      try {
        if (!cursor) setLoading(true);
        else setPostsLoading(true);

        const params = { limit: 9 };
        if (cursor) params.cursor = cursor;

        const { data } = await api.get(`/api/posts/user/${id}/posts`, {
          params,
        });

        if (!cursor) {
          setUser(data.user);
          setIsFollowing(data.isFollowing);
          setIsOwnProfile(data.isOwnProfile);
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
    },
    [id],
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  useEffect(() => {
    if (!socket || !id) return;
    const handleFollowers = ({ followersCount }) =>
      setUser((u) => (u ? { ...u, followersCount } : u));
    socket.on("followers_count_updated", handleFollowers);
    return () => socket.off("followers_count_updated", handleFollowers);
  }, [socket, id]);

  useEffect(() => {
    if (!showAvatar) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowAvatar(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAvatar]);

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) await api.delete(`/api/users/${id}/unfollow`);
      else await api.post(`/api/users/${id}/follow`);
      setIsFollowing((prev) => !prev);
      setUser((u) =>
        u
          ? {
              ...u,
              followersCount: isFollowing
                ? u.followersCount - 1
                : u.followersCount + 1,
            }
          : u,
      );
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error)
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center gap-3">
        <p className="text-danger mb-0">{error}</p>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft className="me-1" /> Go Back
        </Button>
      </div>
    );

  return (
    <>
      <div className="min-vh-100">
        {/* Back */}
        <Button
          variant="link"
          className="text-secondary text-decoration-none ps-3 pt-3 d-inline-flex align-items-center gap-1"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft size={15} /> Back
        </Button>

        {/* Hero */}
        <div className="prof-hero py-5 px-3">
          <Container>
            <Row className="justify-content-center">
              <Col
                xs={12}
                className="d-flex flex-column align-items-center gap-3"
              >
                {/* Avatar — clickable if image exists, with online dot */}
                <div
                  className="prof-avatar-ring"
                  style={{
                    cursor: user?.profilePicture ? "pointer" : "default",
                    position: "relative",
                    display: "inline-block",
                  }}
                  onClick={() => user?.profilePicture && setShowAvatar(true)}
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="profile-avatar prof-avatar-placeholder d-flex align-items-center justify-content-center">
                      <FiUser size={40} className="text-secondary" />
                    </div>
                  )}

                  {/* Online / Offline dot only shown on other people's profiles */}
                  {!isOwnProfile && <OnlineDot online={isOnline} />}
                </div>

                {/* Username & Bio */}
                <div className="text-center">
                  <h1 className="fs-3 fw-semibold mb-1">@{user?.username}</h1>
                  {/* Online status text under the username */}
                  {!isOwnProfile && (
                    <p
                      className="mb-1"
                      style={{
                        fontSize: "0.72rem",
                        color: isOnline ? "#22c55e" : "#9ca3af",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {isOnline ? "● Online" : "● Offline"}
                    </p>
                  )}
                  {user?.bio ? (
                    <p className="text-secondary mb-0 small">{user.bio}</p>
                  ) : (
                    <p className="text-secondary fst-italic mb-0 small opacity-50">
                      No bio.
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="d-flex align-items-center gap-4">
                  <Link
                    to={`/followers/${id}`}
                    className="text-decoration-none text-center"
                  >
                    <div className="fs-5 fw-semibold text-warning">
                      {user?.followersCount ?? 0}
                    </div>
                    <div
                      className="text-muted"
                      style={{
                        fontSize: "0.68rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Followers
                    </div>
                  </Link>
                  <div className="vr opacity-25" style={{ height: 30 }} />
                  <Link
                    to={`/following/${id}`}
                    className="text-decoration-none text-center"
                  >
                    <div className="fs-5 fw-semibold text-warning">
                      {user?.followingCount ?? 0}
                    </div>
                    <div
                      className="text-muted"
                      style={{
                        fontSize: "0.68rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Following
                    </div>
                  </Link>
                  <div className="vr opacity-25" style={{ height: 30 }} />
                  <div className="text-center">
                    <div className="fs-5 fw-semibold text-warning">
                      {posts.length}
                      {hasNextPage ? "+" : ""}
                    </div>
                    <div
                      className="text-muted"
                      style={{
                        fontSize: "0.68rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Posts
                    </div>
                  </div>
                </div>

                {/* Follow + Message */}
                {!isOwnProfile && (
                  <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center">
                    <Button
                      variant={isFollowing ? "outline-secondary" : "primary"}
                      className="rounded-pill px-4"
                      onClick={handleFollow}
                      disabled={followLoading}
                    >
                      {followLoading ? (
                        <Spinner animation="border" size="sm" />
                      ) : isFollowing ? (
                        "Following"
                      ) : (
                        "Follow"
                      )}
                    </Button>
                    <Button
                      variant="outline-primary"
                      className="rounded-pill px-4 d-flex align-items-center gap-2"
                      onClick={() =>
                        user?._id &&
                        navigate("/Conversations", {
                          state: { startWith: user },
                        })
                      }
                    >
                      <FiMessageCircle size={15} /> Message
                    </Button>
                  </div>
                )}

                {/* Edit (own profile) */}
                {isOwnProfile && (
                  <Button
                    variant="outline-warning"
                    className="rounded-pill px-4 d-flex align-items-center gap-2"
                    size="sm"
                    onClick={() => navigate("/My-Profile")}
                  >
                    <FiEdit2 size={14} /> Edit Profile
                  </Button>
                )}
              </Col>
            </Row>
          </Container>
        </div>

        {/* Posts */}
        <Container className="pb-5" style={{ maxWidth: 900 }}>
          <div className="d-flex align-items-center gap-3 mb-4">
            <hr className="flex-grow-1 m-0 opacity-25" />
            <span
              className="text-muted small text-uppercase"
              style={{ letterSpacing: "0.18em" }}
            >
              Posts
            </span>
            <hr className="flex-grow-1 m-0 opacity-25" />
          </div>

          {posts.length === 0 ? (
            <p className="text-center text-muted fst-italic py-5">
              {isFollowing ? "No posts yet." : "Follow to see their posts."}
            </p>
          ) : (
            <Row xs={3} sm={3} lg={4} className="g-3">
              {posts.map((post, i) => (
                <Col key={post._id}>
                  <div
                    onClick={() => navigate(`/post/${post._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <ProfilePostCard
                      post={post}
                      user={user.username}
                      theme={theme}
                      index={i}
                    />
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
            {postsLoading && <Spinner animation="border" size="sm" />}
          </div>
        </Container>
      </div>

      {/* Avatar Lightbox */}
      {showAvatar && (
        <div
          onClick={() => setShowAvatar(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            backdropFilter: "blur(6px)",
          }}
        >
          <img
            src={user.profilePicture}
            alt={user.username}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 16,
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </>
  );
}
