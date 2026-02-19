import { create } from 'zustand';
import { apiGetFeed, apiCreatePost, apiToggleLike } from '../services/api';

const useFeedStore = create((set, get) => ({
    posts: [],
    page: 1,
    hasMore: true,
    isLoading: false,

    fetchFeed: async (wardId, refresh = false) => {
        if (!wardId || get().isLoading) return;
        set({ isLoading: true });
        try {
            const page = refresh ? 1 : get().page;
            const { posts, pages } = await apiGetFeed(wardId, page);
            set((state) => ({
                posts: refresh ? posts : [...state.posts, ...posts],
                page: page + 1,
                hasMore: page < pages,
                isLoading: false,
            }));
        } catch (e) {
            set({ isLoading: false });
        }
    },

    addPost: (post) => {
        set((state) => ({ posts: [post, ...state.posts] }));
    },

    createPost: async (content) => {
        const { post } = await apiCreatePost({ content });
        get().addPost(post);
        return post;
    },

    // Fix P0 toggleLike: track liked state properly using actual user like count
    // from server response instead of mutating array with fake IDs.
    toggleLike: async (postId, currentUserId) => {
        // Optimistic toggle first
        set((state) => ({
            posts: state.posts.map(p =>
                p._id === postId
                    ? {
                        ...p,
                        _optimisticLiked: !p._optimisticLiked,
                        likesCount: (p.likesCount ?? 0) + (p._optimisticLiked ? -1 : 1),
                    }
                    : p
            ),
        }));

        try {
            const { liked, likesCount } = await apiToggleLike(postId);
            // Reconcile with server truth
            set((state) => ({
                posts: state.posts.map(p =>
                    p._id === postId
                        ? { ...p, _optimisticLiked: liked, likesCount }
                        : p
                ),
            }));
        } catch (e) {
            // Revert optimistic update on failure
            set((state) => ({
                posts: state.posts.map(p =>
                    p._id === postId
                        ? {
                            ...p,
                            _optimisticLiked: !p._optimisticLiked,
                            likesCount: (p.likesCount ?? 0) + (p._optimisticLiked ? -1 : 1),
                        }
                        : p
                ),
            }));
        }
    },
}));

export default useFeedStore;
