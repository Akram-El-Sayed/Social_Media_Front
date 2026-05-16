import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "../../utils/api";
import { useSocket } from "../../Hooks/useSocket";
import PostCard from "../../Components/PostCard/PostCard";

export default function HashtagPosts({ theme }) {
  const { tag } = useParams();
  const { userInfo } = useSelector((state) => state.user);
  const { socket, isConnected } = useSocket();

  const [posts, setPosts]           = useState([]);
  const [cursor, setCursor]         = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading]       = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loaderRef      = useRef(null);
  const cursorRef      = useRef(cursor);
  const hasNextRef     = useRef(hasNextPage);
  const loadingMoreRef = useRef(loadingMore);

  useEffect(() => { cursorRef.current = cursor; },      [cursor]);
  useEffect(() => { hasNextRef.current = hasNextPage; }, [hasNextPage]);
  useEffect(() => { loadingMoreRef.current = loadingMore; }, [loadingMore]);

  // Fetch 
  const fetchPosts = useCallback(
    async (cursorParam = null) => {
      try {
        const params = { limit: 10 };
        if (cursorParam) params.cursor = cursorParam;

        const { data } = await api.get(`/api/posts/hashtag/${encodeURIComponent(tag)}`, { params });

        const incoming = data.posts ?? [];

        setPosts((prev) => (cursorParam ? [...prev, ...incoming] : incoming));
        setCursor(data.nextCursor ?? null);
        setHasNextPage(data.hasMore ?? false);
      } catch (err) {
        console.error("HashtagPosts fetch error:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [tag],
  );

  // Reset + initial load whenever the tag changes
  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasNextPage(true);
    setLoading(true);
    fetchPosts(null);
  }, [tag , fetchPosts]); // fetchPosts intentionally excluded — tag change is the real trigger

  // Infinite scroll 
  useEffect(() => {
    if (loading || !loaderRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextRef.current && !loadingMoreRef.current) {
          setLoadingMore(true);
          fetchPosts(cursorRef.current);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchPosts, loading]);

  // Real-time like updates 
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handler = ({ postId, likesCount }) => {
     
      if (likesCount === undefined) return;

      setPosts((prev) =>
        prev.map((p) =>
          p._id?.toString() === postId?.toString()
            ? { ...p, likesCount }
            : p,
        ),
      );
    };

    socket.on("feed:post_updated", handler);
    return () => socket.off("feed:post_updated", handler);
  }, [socket, isConnected]);

  // Local delete handler 
  const handleDelete = useCallback((deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  }, []);

  // Render
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border text-warning" role="status" />
      </div>
    );
  }

  return (
    <div className="home-feed d-flex flex-column justify-content-center align-items-center">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 ">
        <h5 className="fw-bold mb-0">#{tag}</h5>
        <small className="text-secondary">
          {posts.length > 0 ? `${posts.length}+ posts` : "No posts found"}
        </small>
      </div>

      {posts.length === 0 && !loading ? (
        <div className="text-center py-5 text-secondary">
          <p>No public posts found for <strong>#{tag}</strong>.</p>
        </div>
      ) : (
        <div className="home-feed__list">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={userInfo}
              onDelete={handleDelete}
              theme={theme}
            />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={loaderRef} className="text-center py-3">
            {loadingMore && (
              <div
                className="spinner-border spinner-border-sm text-warning"
                role="status"
              />
            )}
            {!hasNextPage && posts.length > 0 && (
              <p className="text-secondary small">You've seen all posts for #{tag} ✓</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
