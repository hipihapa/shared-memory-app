import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

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

// Fetch space by ID
export async function getSpaceById(spaceId: string) {
  try {
    const response = await api.get(`/spaces/id/${spaceId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching space:", error);
    throw error?.response?.data || error;
  }
}

export const updateSpaceMode = async (spaceId, isPublic) => {
  try {
    const response = await api.patch(`/spaces/${spaceId}/mode`, { isPublic });
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
}

// Paystack: Initialize payment
export const initializePaystackPayment = async (paymentData) => {
  try {
    const response = await api.post('/spaces/paystack/initialize', paymentData);
    return response.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Check if user exists in database
export async function checkUserExists(uid: string): Promise<{ exists: boolean; user?: any; message?: string }> {
  try {
    const response = await api.get(`/user/${uid}/exists`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return { exists: false, message: error.response.data.message };
    }
    console.error("Error checking user existence:", error);
    throw new Error("Failed to check user existence");
  }
}

// Create a new user
export async function createUser(userData: { uid: string; email: string; displayName?: string }): Promise<any> {
  try {
    const response = await api.post('/user', userData);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message);
    }
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
}

// Check if URL slug is available
export async function checkUrlSlugAvailability(urlSlug: string): Promise<{ available: boolean; message: string; suggestedSlug?: string }> {
  try {
    const response = await api.get(`/spaces/check-slug/${urlSlug}`);
    return response.data;
  } catch (error: any) {
    console.error("Error checking URL slug availability:", error);
    throw new Error("Failed to check URL slug availability");
  }
}

export default api;