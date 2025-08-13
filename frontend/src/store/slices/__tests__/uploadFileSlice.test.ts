import { describe, it, expect, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import uploadFilesReducer, { 
  setFiles, 
  addFiles, 
  removeFile, 
  clearFiles
} from '../uploadFileSlice'

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      uploadFiles: uploadFilesReducer,
    },
  })
}

describe('uploadFilesSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  describe('Initial State', () => {
    it('should have initial state', () => {
      const state = store.getState().uploadFiles
      expect(state).toEqual({
        files: [],
      })
    })
  })

  describe('setFiles Action', () => {
    it('should set files array', () => {
      const testFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
      ]

      store.dispatch(setFiles(testFiles))
      const state = store.getState().uploadFiles

      expect(state.files).toEqual(testFiles)
      expect(state.files).toHaveLength(2)
    })

    it('should replace existing files', () => {
      // First, add some files
      const initialFiles = [new File(['initial'], 'initial.jpg', { type: 'image/jpeg' })]
      store.dispatch(setFiles(initialFiles))

      // Then replace them
      const newFiles = [new File(['new'], 'new.jpg', { type: 'image/jpeg' })]
      store.dispatch(setFiles(newFiles))

      const state = store.getState().uploadFiles
      expect(state.files).toEqual(newFiles)
      expect(state.files).toHaveLength(1)
    })
  })

  describe('addFiles Action', () => {
    it('should add files to existing files', () => {
      const initialFiles = [new File(['initial'], 'initial.jpg', { type: 'image/jpeg' })]
      store.dispatch(setFiles(initialFiles))

      const newFiles = [new File(['new'], 'new.jpg', { type: 'image/jpeg' })]
      store.dispatch(addFiles(newFiles))

      const state = store.getState().uploadFiles
      expect(state.files).toHaveLength(2)
      expect(state.files[1]).toEqual(newFiles[0])
    })

    it('should add files to empty array', () => {
      const newFiles = [new File(['new'], 'new.jpg', { type: 'image/jpeg' })]
      store.dispatch(addFiles(newFiles))

      const state = store.getState().uploadFiles
      expect(state.files).toHaveLength(1)
      expect(state.files[0]).toEqual(newFiles[0])
    })
  })

  describe('removeFile Action', () => {
    it('should remove file by index', () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
      ]
      store.dispatch(setFiles(files))

      store.dispatch(removeFile(0))
      const state = store.getState().uploadFiles

      expect(state.files).toHaveLength(1)
      expect(state.files[0]).toEqual(files[1])
    })

    it('should do nothing if index does not exist', () => {
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]
      store.dispatch(setFiles(files))

      store.dispatch(removeFile(5))
      const state = store.getState().uploadFiles

      expect(state.files).toHaveLength(1)
      expect(state.files[0]).toEqual(files[0])
    })
  })

  describe('clearFiles Action', () => {
    it('should clear all files', () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
      ]
      store.dispatch(setFiles(files))
      expect(store.getState().uploadFiles.files).toHaveLength(2)

      store.dispatch(clearFiles())
      const state = store.getState().uploadFiles
      expect(state.files).toHaveLength(0)
      expect(state.files).toEqual([])
    })
  })

  describe('State Immutability', () => {
    it('should not mutate original state', () => {
      const initialState = store.getState().uploadFiles
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]

      store.dispatch(setFiles(files))
      const newState = store.getState().uploadFiles

      expect(newState).not.toBe(initialState)
      expect(initialState.files).toEqual([])
      expect(newState.files).toEqual(files)
    })
  })

  describe('Complex Operations', () => {
    it('should handle multiple operations in sequence', () => {
      // Add files
      const file1 = new File(['file1'], 'file1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['file2'], 'file2.png', { type: 'image/png' })
      
      store.dispatch(setFiles([file1]))
      store.dispatch(addFiles([file2]))
      expect(store.getState().uploadFiles.files).toHaveLength(2)

      // Remove a file
      store.dispatch(removeFile(1))
      expect(store.getState().uploadFiles.files).toHaveLength(1)
      expect(store.getState().uploadFiles.files[0]).toEqual(file1)

      // Clear files
      store.dispatch(clearFiles())
      expect(store.getState().uploadFiles.files).toHaveLength(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty file arrays', () => {
      store.dispatch(setFiles([]))
      const state = store.getState().uploadFiles
      expect(state.files).toEqual([])
      expect(state.files).toHaveLength(0)
    })

    it('should handle File objects correctly', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      store.dispatch(setFiles([file]))
      
      const state = store.getState().uploadFiles
      expect(state.files[0]).toBeInstanceOf(File)
      expect(state.files[0].name).toBe('test.jpg')
      expect(state.files[0].type).toBe('image/jpeg')
    })
  })
})
