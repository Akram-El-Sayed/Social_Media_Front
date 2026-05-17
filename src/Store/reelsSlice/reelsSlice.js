import { createSlice } from "@reduxjs/toolkit";

const reelsSlice = createSlice({
  name: "reels",
  initialState: {
    posts: [],
    cursor: null,
    hasNextPage: true,
    loading: false,
  },
  reducers: {
    setReels: (state, action) => {
      state.posts = action.payload.reels;
      state.cursor = action.payload.nextCursor;
      state.hasNextPage = action.payload.hasNextPage;
      state.loading = false;
    },
    appendReels: (state, action) => {
      state.posts = [...state.posts, ...action.payload.reels];
      state.cursor = action.payload.nextCursor;
      state.hasNextPage = action.payload.hasNextPage;
    },
    setReelsLoading: (state, action) => {
      state.loading = action.payload;
    },
    updateReel: (state, action) => {
      const { postId, likesCount, sharesCount, commentsCount } = action.payload;
      const post = state.posts.find((p) => p._id === postId);
      if (!post) return;
      if (likesCount    !== undefined) post.likesCount    = likesCount;
      if (sharesCount   !== undefined) post.sharesCount   = sharesCount;
      if (commentsCount !== undefined) post.commentsCount = commentsCount;
    },
    // same avatar + follow patchers as feedSlice
    updateReelsUserAvatar: (state, action) => {
      const { userId, profilePicture } = action.payload;
      state.posts.forEach((post) => {
        if (post.user?._id === userId) post.user.profilePicture = profilePicture;
      });
    },
    updateReelsFollowState: (state, action) => {
      const { userId, isFollowing } = action.payload;
      state.posts.forEach((post) => {
        if (post.user?._id === userId) post.isFollowing = isFollowing;
      });
    },
  },
});

export const {
  setReels,
  appendReels,
  setReelsLoading,
  updateReel,
  updateReelsUserAvatar,
  updateReelsFollowState,
} = reelsSlice.actions;

export default reelsSlice.reducer;