import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { RootState, AppDispatch, clearAuth } from "../store";

const AdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const { admin } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(clearAuth());
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <nav>
          <Link to="/dashboard" className="block py-2">
            {t("nav.dashboard")}
          </Link>
          <Link to="/jobs" className="block py-2">
            {t("nav.jobs")}
          </Link>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="bg-white p-4 shadow flex justify-between items-center">
          <span>{admin?.email}</span>
          <button onClick={handleLogout}>{t("nav.logout")}</button>
        </header>
        <main className="p-4 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
