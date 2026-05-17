import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import PostCard from "../../Components/PostCard/PostCard";
import { useSocket } from "../../Hooks/useSocket";
import {
  setReels,
  appendReels,
  setReelsLoading,
  updateReel,
} from "../../Store/reelsSlice/reelsSlice";

export default function Reels({ theme }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo } = useSelector((state) => state.user);
  const { posts, cursor, hasNextPage, loading } = useSelector((state) => state.reels);
  const { socket, isConnected } = useSocket();

  const [gettingMorePosts, setGettingMorePosts] = useState(false);

  const loaderRef = useRef(null);
  const cursorRef = useRef(cursor);
  const hasNextPageRef = useRef(hasNextPage);
  const gettingMoreRef = useRef(gettingMorePosts);

  useEffect(() => { cursorRef.current = cursor; }, [cursor]);
  useEffect(() => { hasNextPageRef.current = hasNextPage; }, [hasNextPage]);
  useEffect(() => { gettingMoreRef.current = gettingMorePosts; }, [gettingMorePosts]);

  const fetchReels = useCallback(async (cursorParam = null) => {
    try {
      if (!cursorParam && posts.length === 0) dispatch(setReelsLoading(true));
      const params = { limit: 10 };
      if (cursorParam) params.cursor = cursorParam;
      const { data } = await api.get("/api/posts/reels", { params });
      if (cursorParam) {
        dispatch(appendReels(data));
      } else {
        dispatch(setReels(data));
      }
    } catch (err) {
      console.error("Failed to fetch reels", err);
    } finally {
      dispatch(setReelsLoading(false));
      setGettingMorePosts(false);
    }
  }, [dispatch, posts.length]);

  // Initial load — only fetch if Redux is empty
  useEffect(() => {
    if (posts.length === 0) fetchReels();
  }, [fetchReels, posts.length]);

  // Refresh when nav link is clicked while already on /Reels
  const refreshReels = useCallback(async () => {
    try {
      dispatch(setReelsLoading(true));
      window.scrollTo(0, 0);
      sessionStorage.removeItem("reels-scroll-y");
      const { data } = await api.get("/api/posts/reels", { params: { limit: 10 } });
      dispatch(setReels(data));
    } catch (err) {
      console.error("Failed to refresh reels", err);
    } finally {
      dispatch(setReelsLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (location.state?.refresh) {
      refreshReels();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, refreshReels, navigate, location.pathname]);

  // Infinite scroll
  useEffect(() => {
    if (loading || !loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPageRef.current && !gettingMoreRef.current) {
          setGettingMorePosts(true);
          fetchReels(cursorRef.current);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchReels, loading]);

  // Real-time like updates
  useEffect(() => {
    if (!socket || !isConnected) return;
    const handler = (data) => dispatch(updateReel(data));
    socket.on("feed:post_updated", handler);
    return () => socket.off("feed:post_updated", handler);
  }, [socket, isConnected, dispatch]);

  // Save scroll position
  useEffect(() => {
    const handleSave = () => {
      if (window.scrollY !== 0) sessionStorage.setItem("reels-scroll-y", window.scrollY);
    };
    window.addEventListener("scroll", handleSave);
    return () => window.removeEventListener("scroll", handleSave);
  }, []);

  // Restore scroll position
  useLayoutEffect(() => {
    if (posts.length > 0) {
      const saved = sessionStorage.getItem("reels-scroll-y");
      if (saved) window.scrollTo({ top: parseInt(saved, 10), behavior: "instant" });
    }
  }, [posts.length]);

  if (loading && posts.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-warning" role="status" />
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="text-center py-5 text-secondary">
        <p>No reels yet. Follow people to see their posts!</p>
      </div>
    );
  }

  return (
    <div className="home-feed">
      <div className="home-feed__list">
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            currentUser={userInfo}
            socket={socket}
            theme={theme}
            onDelete={() => {}} // reels don't need delete from feed
          />
        ))}
        <div ref={loaderRef} className="text-center py-3">
          {gettingMorePosts && (
            <div className="spinner-border spinner-border-sm text-warning" role="status" />
          )}
          {!hasNextPage && posts.length > 0 && (
            <p className="text-secondary small">You're all caught up ✓</p>
          )}
        </div>
      </div>
    </div>
  );
}
