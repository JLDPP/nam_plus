import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export function setAuth(
  token: string | null
) {
  if (token) {
    api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common[
      "Authorization"
    ];
  }
}

setAuth(
  localStorage.getItem("token")
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status === 401
    ) {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      setAuth(null);

      window.location.href =
        "/login";
    }

    return Promise.reject(error);
  }
);