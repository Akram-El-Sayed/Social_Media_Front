import { createSlice } from "@reduxjs/toolkit";

const feedSlice = createSlice({
  name: "feed",
  initialState: {
    posts: [],
    cursor: null,
    hasNextPage: true,
    loading: false,
  },
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload.posts;
      state.cursor = action.payload.nextCursor;
      state.hasNextPage = action.payload.hasNextPage;
      state.loading = false;
    },
    appendPosts: (state, action) => {
      state.posts = [...state.posts, ...action.payload.posts];
      state.cursor = action.payload.nextCursor;
      state.hasNextPage = action.payload.hasNextPage;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    updatePost: (state, action) => {
      const { postId, likesCount, sharesCount, commentsCount } = action.payload;
      const post = state.posts.find((p) => p._id === postId);
      if (!post) return;
      if (likesCount    !== undefined) post.likesCount    = likesCount;
      if (sharesCount   !== undefined) post.sharesCount   = sharesCount;
      if (commentsCount !== undefined) post.commentsCount = commentsCount;
    },
    removePost: (state, action) => {
      state.posts = state.posts.filter((post) => post._id !== action.payload);
    },

    // update avatar on every post that belongs to this user
    updateFeedUserAvatar: (state, action) => {
      const { userId, profilePicture } = action.payload;
      state.posts.forEach((post) => {
        if (post.user?._id === userId) {
          post.user.profilePicture = profilePicture;
        }
      });
    },

    // persist follow state so remounts read the right value
    updateFeedFollowState: (state, action) => {
      const { userId, isFollowing } = action.payload;
      state.posts.forEach((post) => {
        if (post.user?._id === userId) {
          post.isFollowing = isFollowing;
        }
      });
    },
  },
});

export const {
  setPosts,
  appendPosts,
  setLoading,
  updatePost,
  removePost,
  updateFeedUserAvatar,
  updateFeedFollowState,
} = feedSlice.actions;

export default feedSlice.reducer;
