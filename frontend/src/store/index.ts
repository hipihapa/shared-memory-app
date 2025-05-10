import { configureStore } from "@reduxjs/toolkit";
import uploadFilesReducer from "./slices/uploadFileSlice";

export const store = configureStore({
  reducer: {
    uploadFiles: uploadFilesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
// export default store;