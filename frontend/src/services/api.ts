import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Space related API calls
export const createSpace = async (spaceData) => {
  try {
    const response = await api.post('/spaces', spaceData);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const getSpaceBySlug = async (urlSlug) => {
  try {
    const response = await api.get(`/spaces/${urlSlug}`);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Media related API calls
export const uploadMedia = async (spaceId, file, uploadedBy = 'Guest') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', uploadedBy);

    const response = await api.post(`/spaces/${spaceId}/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Fetch all media for a space
export const getMediaBySpace = async (spaceId) => {
  try {
    const response = await api.get(`/spaces/${spaceId}/media`);
    return response.data;
  } catch (error) {
    console.error("Error fetching media" ,error);
    throw error?.response?.data || error;
  }
};

// Delete media
export const deleteMedia = async (spaceId, mediaId) => {
  try {
    const response = await api.delete(`/spaces/${spaceId}/media/${mediaId}`);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Fetch the user's spaceId
export async function getUserSpaceId(uid: string): Promise<string> {
  try {
    const response = await api.get(`/spaces/user/${uid}/spaceId`);
    return response.data.spaceId;
  } catch (error) {
    console.error("Error fetching user spaceId:", error);
    throw new Error("Failed to fetch user spaceId");
  }
}

export const updateSpaceMode = async (spaceId, isPublic) => {
  try {
    const response = await api.patch(`/spaces/${spaceId}/mode`, { isPublic })
  } catch (error) {
    throw error?.response?.data || error;
  }
}


export default api;

