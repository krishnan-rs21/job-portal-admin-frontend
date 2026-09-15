import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuth } from "../store";
import apiClient from "../services/apiClient";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const payload = response.data?.data ?? response.data;
      const accessToken = payload.accessToken;
      // In the absence of an explicit user object in the response, we might need to handle this differently.
      // For now, let's proceed if we have an accessToken. 
      // Note: This assumes the backend expects the frontend to decode the JWT or fetch user details separately.
      const user = payload.user ?? payload.admin ?? { role: "ADMIN" }; 
      
      if (!accessToken) {
        setError(t("errors.unauthorized"));
        setLoading(false);
        return;
      }
      dispatch(setAuth({ accessToken, admin: user }));
      navigate("/dashboard", { replace: true });
    } catch {
      setError(t("errors.unauthorized"));
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white shadow rounded w-full max-w-sm">
        <h2 className="text-2xl mb-4">{t("login.title")}</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("login.email")}
          className="border p-2 mb-2 w-full"
          required
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("login.password")}
          className="border p-2 mb-2 w-full"
          required
          disabled={loading}
        />
        <button type="submit" className="bg-blue-500 text-white p-2 w-full" disabled={loading}>
          {loading ? t("login.loading") : t("login.submit")}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default LoginPage;
