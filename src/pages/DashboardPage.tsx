import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminJobs } from "../store/slices/adminJobsSlice";
import type { AppDispatch, RootState } from "../store";
import { Link } from "react-router-dom";

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { jobs } = useSelector((state: RootState) => state.adminJobs);

  useEffect(() => {
    dispatch(fetchAdminJobs({ limit: 5 }));
  }, [dispatch]);

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("nav.dashboard")}</h1>
      <div className="grid grid-cols-3 gap-4 my-4">
        <div className="p-4 bg-white shadow">
          {t("dashboard.totalJobs")}: {jobs.length}
        </div>
        <Link to="/jobs/create" className="p-4 bg-blue-500 text-white">
          {t("dashboard.createNewJob")}
        </Link>
      </div>
      <table className="w-full bg-white shadow">
        <thead>
          <tr>
            <th>{t("jobs.title")}</th>
            <th>{t("jobs.status")}</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.uuid}>
              <td>{job.title}</td>
              <td>{job.isActive ? t("jobs.active") : t("jobs.archived")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardPage;
