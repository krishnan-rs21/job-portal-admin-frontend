import apiClient from "./apiClient";

export const fetchMetaData = async () => {
  const response = await apiClient.get("/v1/meta/config");
  return response.data.data;
};
