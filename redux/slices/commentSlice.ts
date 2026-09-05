import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Comment } from '@/lib/types';
import { INITIAL_COMMENTS } from '@/lib/seedData';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/storage';

interface CommentState {
  comments: Comment[];
}

const savedComments = getFromLocalStorage<Comment[]>('comments', INITIAL_COMMENTS);

const initialState: CommentState = {
  comments: savedComments,
};

export const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments.push(action.payload);
      saveToLocalStorage('comments', state.comments);
    },
    updateComment: (
      state,
      action: PayloadAction<{ id: string; content: string }>
    ) => {
      const comment = state.comments.find((c) => c.id === action.payload.id);
      if (comment) {
        comment.content = action.payload.content;
        comment.updatedAt = new Date().toISOString();
        saveToLocalStorage('comments', state.comments);
      }
    },
    deleteComment: (state, action: PayloadAction<string>) => {
      state.comments = state.comments.filter((c) => c.id !== action.payload);
      saveToLocalStorage('comments', state.comments);
    },
    setComments: (state, action: PayloadAction<Comment[]>) => {
      state.comments = action.payload;
      saveToLocalStorage('comments', state.comments);
    },
  },
});

export const { addComment, updateComment, deleteComment, setComments } = commentSlice.actions;
export default commentSlice.reducer;
