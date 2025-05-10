import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UploadFilesState {
  files: File[];
}

const initialState: UploadFilesState = {
  files: [],
};

const uploadFilesSlice = createSlice({
  name: "uploadFiles",
  initialState,
  reducers: {
    setFiles(state, action: PayloadAction<File[]>) {
      state.files = action.payload;
    },
    addFiles(state, action: PayloadAction<File[]>) {
      state.files = [...state.files, ...action.payload];
    },
    removeFile(state, action: PayloadAction<number>) {
      state.files = state.files.filter((_, idx) => idx !== action.payload);
    },
    clearFiles(state) {
      state.files = [];
    },
  },
});

export const { setFiles, addFiles, removeFile, clearFiles } = uploadFilesSlice.actions;
export default uploadFilesSlice.reducer;