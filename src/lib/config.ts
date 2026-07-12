// API base URL — defaults to hive_api_gateway on localhost.
// Override with env var for different targets:
//   Gazebo / backend/api.py :  VITE_GATEWAY_URL=http://localhost:8000 npm run dev
//   Real robot              :  VITE_GATEWAY_URL=http://10.10.0.200:1717 npm run dev
export const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:1717';
