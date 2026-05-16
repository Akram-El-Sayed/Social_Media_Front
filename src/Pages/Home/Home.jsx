import React, { useEffect, useRef, useCallback, useLayoutEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { api } from "../../utils/api";
import PostCard from "../../Components/PostCard/PostCard";
import { useSocket } from "../../Hooks/useSocket";
import { useLocation, useNavigate } from "react-router-dom";
// Import the actions from your new feedSlice
import { setPosts, appendPosts, setLoading, updatePost , removePost } from "../../Store/feedSlice/feedSlice";

export default function Home({ theme }) {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  const location = useLocation();
  
  
  // Pull feed state from Redux
  const { posts, cursor, hasNextPage, loading } = useSelector((state) => state.feed);
  
  // for the "loading more" spinner state
  const [gettingMorePosts, setGettingMorePosts] = useState(false);
  
  const loaderRef = useRef(null);
  const { socket, isConnected } = useSocket()

  // Refs to avoid stale closures in the IntersectionObserver
  const cursorRef = useRef(cursor);
  const hasNextPageRef = useRef(hasNextPage);
  const gettingMoreRef = useRef(gettingMorePosts);
  const navigate = useNavigate();

  useEffect(() => { cursorRef.current = cursor; }, [cursor]);
  useEffect(() => { hasNextPageRef.current = hasNextPage; }, [hasNextPage]);
  useEffect(() => { gettingMoreRef.current = gettingMorePosts; }, [gettingMorePosts]);

 

  const refreshFeed = useCallback(async () => {
  try {
    dispatch(setLoading(true));

    // Scroll to top immediately
   window.scrollTo(0, 0);

    // Clear saved scroll
    sessionStorage.removeItem("home-scroll-y");

    // Fetch fresh posts WITHOUT cursor
    const { data } = await api.get("/api/posts/feed", {
      params: { limit: 10 }
    });

    dispatch(setPosts(data)); // replaces feed
  } catch (err) {
    console.error("Failed to refresh feed", err);
  } finally {
    dispatch(setLoading(false));
  }
}, [dispatch]);

useEffect(() => {
  if (location.state?.refresh) {
    refreshFeed();

    // Clear the state so it doesn't trigger again
    navigate(location.pathname, { replace: true, state: {} });
  }
}, [location.state, refreshFeed, navigate, location.pathname]);

useEffect(() => {
  if (!socket) return;

  const handleRefresh = () => {
    refreshFeed();
  };

  socket.on("home:refresh", handleRefresh);
  return () => socket.off("home:refresh", handleRefresh);
}, [socket, refreshFeed]);

  const fetchPosts = useCallback(async (cursorParam = null) => {
    try {
      // Only show main loading spinner if it's the very first load
      if (!cursorParam && posts.length === 0) dispatch(setLoading(true));
      
      const params = { limit: 10 };
      if (cursorParam) params.cursor = cursorParam;

      const { data } = await api.get("/api/posts/feed", { params });

      if (cursorParam) {
        dispatch(appendPosts(data));
      } else {
        dispatch(setPosts(data));
      }
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      dispatch(setLoading(false));
      setGettingMorePosts(false);
    }
  }, [dispatch, posts.length]);

  // Initial load: Only fetch if the Redux store is empty
  useEffect(() => {
    if (posts.length === 0) {
      fetchPosts();
    }
  }, [fetchPosts, posts.length]);

  // Infinite scroll observer
  useEffect(() => {
    if (loading || !loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPageRef.current &&
          !gettingMoreRef.current
        ) {
          setGettingMorePosts(true);
          fetchPosts(cursorRef.current);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchPosts, loading]);

  const handleDeletePost = useCallback((postId) => {
    dispatch(removePost(postId));
  }, [dispatch]);

  // Real-time feed updates (likes)
  useEffect(() => {
  if (!socket || !isConnected) return;

  
  const handler = (data) => dispatch(updatePost(data));

  socket.on("feed:post_updated", handler);
  return () => socket.off("feed:post_updated", handler);
}, [socket, isConnected, dispatch]);

  // SAVE SCROLL POSITION BEFORE LEAVING
useEffect(() => {
  const handleSave = () => {
    if (window.scrollY !== 0) {
      sessionStorage.setItem("home-scroll-y", window.scrollY);
    }
  };

  window.addEventListener("scroll", handleSave);
  return () => window.removeEventListener("scroll", handleSave);
}, []);

// to RESTORE position instantly
useLayoutEffect(() => {
  // Only attempt restoration if Redux has posts ready
  if (posts.length > 0) {
    const savedScroll = sessionStorage.getItem("home-scroll-y");
    
    if (savedScroll) {
      const scrollPos = parseInt(savedScroll, 10);
  
      window.scrollTo({
        top: scrollPos,
        behavior: "instant"
      });
    }
  }
}, [posts.length]); // Runs when posts are loaded from Redux

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
        <p>No posts yet. Follow people to see their posts!</p>
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
            onDelete={handleDeletePost}
          />
        ))}

        {/* Infinite scroll trigger */}
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