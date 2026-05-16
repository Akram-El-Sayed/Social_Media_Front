import React from 'react'
import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { api } from "../../utils/api";
import PostCard from "../../Components/PostCard/PostCard";
import { useSocket } from "../../Hooks/useSocket";

export default function Reels() {
   const { userInfo } = useSelector((state) => state.user);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cursor, setCursor] = useState(null);
    const [MorePosts, setMorePosts] = useState(true);
    const [GetingMorePosts, setGetingMorePosts] = useState(false);
    const loaderRef = useRef(null);
    const { socket, isConnected } = useSocket();
    const fetchPosts = useCallback(async (cursorParam = null) => {
      try {
        const params = { limit: 10 };
        if (cursorParam) params.cursor = cursorParam;
        const { data } = await api.get("/api/posts/reels", { params });
        setPosts((prev) =>
          cursorParam ? [...prev, ...data.reels] : data.reels
        );
        setCursor(data.nextCursor);
        setMorePosts(data.hasNextPage);
      } catch (err) {
        console.error("Failed to fetch posts", err);
      } finally {
        setLoading(false);
        setGetingMorePosts(false);
      }
    }, []);
  
    // Initial load
    useEffect(() => {
      fetchPosts();
    }, [fetchPosts]);
  
    // Infinite scroll
    useEffect(() => {
      if (!loaderRef.current) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && MorePosts && !GetingMorePosts) {
            setGetingMorePosts(true);
            fetchPosts(cursor);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(loaderRef.current);
      return () => observer.disconnect();
    }, [cursor, MorePosts, GetingMorePosts, fetchPosts]);
  
    // Real-time feed updates (likes)
    useEffect(() => {
    if (!socket || !isConnected) return;
    const handler = ({ postId, likesCount }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p._id.toString() === postId.toString() 
            ? { ...p, likesCount }
            : p
        )
      );
    };
    socket.on("feed:post_updated", handler);
    return () => socket.off("feed:post_updated", handler);
  }, [socket, isConnected]);
  
    if (loading) {
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
            />
          ))}
  
          {/* Infinite scroll trigger */}
          <div ref={loaderRef} className="text-center py-3">
            {GetingMorePosts && (
              <div className="spinner-border spinner-border-sm text-warning" role="status" />
            )}
            {!MorePosts && posts.length > 0 && (
              <p className="text-secondary small">You're all caught up ✓</p>
            )}
          </div>
        </div>
      </div>
    );
}
