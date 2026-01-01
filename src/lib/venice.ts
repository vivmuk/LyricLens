import axios from 'axios';

// In a real deployment, this should be an environment variable.
// API Key is now passed dynamically
const BASE_URL = 'https://api.venice.ai/api/v1';


export const createVeniceClient = (apiKey: string) => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
};


