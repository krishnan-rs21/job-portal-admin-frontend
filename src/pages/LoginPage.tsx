import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { setAuth } from "../store";
import type { RootState } from "../store";
import { getErrorMessage } from "../services/apiClient";
import { loginRequest } from "../services/authService";
import { AlertIcon, BriefcaseIcon, LockIcon, MailIcon } from "../components/Icons";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accessToken, admin } = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (accessToken && admin?.role?.toUpperCase() === "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!EMAIL_PATTERN.test(email)) {
      setError(t("login.invalidEmail"));
      return;
    }
    setLoading(true);
    try {
      const { accessToken, refreshToken, user: loginUser } = await loginRequest(email.trim(), password);

      if (!accessToken || !loginUser) {
        setError(t("errors.unauthorized"));
        setLoading(false);
        return;
      }
      if (loginUser.role?.toUpperCase() !== "ADMIN") {
        setError(t("login.notAdmin"));
        setLoading(false);
        return;
      }

      const user = {
        uuid: loginUser.uuid,
        name: `${loginUser.firstName ?? ""} ${loginUser.lastName ?? ""}`.trim() || loginUser.email.split("@")[0],
        email: loginUser.email,
        role: loginUser.role,
      };
      dispatch(setAuth({ accessToken, refreshToken, admin: user }));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t("errors.serverError")));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white">
            <BriefcaseIcon />
          </div>
          <span className="text-lg font-semibold text-white">JobPortal</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight text-white">{t("login.heroTitle")}</h1>
          <p className="mt-4 max-w-md text-slate-400">{t("login.heroSubtitle")}</p>
        </div>
        <p className="relative text-sm text-slate-500">© {new Date().getFullYear()} JobPortal</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BriefcaseIcon />
            </div>
            <span className="text-lg font-semibold text-slate-900">JobPortal</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{t("login.title")}</h2>
          <p className="mt-2 text-sm text-slate-500">{t("login.subtitle")}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label htmlFor="email" className="label">
                {t("login.email")}
              </label>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jobportal.com"
                  className="input pl-9"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="label">
                {t("login.password")}
              </label>
              <div className="relative">
                <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-9"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-2.5"
              disabled={loading || !email || !password}
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {loading ? t("login.loading") : t("login.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
