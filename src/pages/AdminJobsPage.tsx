import React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminJobs,
  toggleJobStatus,
  deleteJob,
} from "../store/slices/adminJobsSlice";
import type { AppDispatch, RootState } from "../store";
import { Link, useSearchParams } from "react-router-dom";

const AdminJobsPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, meta, status } = useSelector(
    (state: RootState) => state.adminJobs,
  );
  const [searchParams] = useSearchParams();

  useEffect(() => {
    dispatch(fetchAdminJobs(Object.fromEntries(searchParams)));
  }, [dispatch, searchParams]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("nav.jobs")}</h1>
        <Link to="/jobs/create" className="bg-blue-500 text-white px-4 py-2 rounded">
          {t("dashboard.createNewJob")}
        </Link>
      </div>
      {status === "loading" && <p className="mt-4">{t("jobs.loading")}</p>}
      {status === "failed" && <p className="mt-4 text-red-500">{t("errors.serverError")}</p>}
      <table className="w-full bg-white shadow mt-4">
        <thead>
          <tr>
            <th className="text-left p-2">{t("jobs.title")}</th>
            <th className="text-left p-2">{t("jobs.status")}</th>
            <th className="text-left p-2">{t("jobs.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.uuid}>
              <td className="p-2">{job.title}</td>
              <td className="p-2">
                {job.isActive ? t("jobs.active") : t("jobs.archived")}
              </td>
              <td className="p-2 space-x-3">
                <button
                  onClick={() =>
                    dispatch(
                      toggleJobStatus({
                        uuid: job.uuid,
                        isActive: !job.isActive,
                      }),
                    )
                  }
                >
                  {t("jobs.toggle")}
                </button>
                <Link to={`/jobs/${job.uuid}/edit`}>{t("jobs.edit")}</Link>
                <button onClick={() => dispatch(deleteJob(job.uuid))}>
                  {t("jobs.delete")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {meta.total > 0 && (
        <p className="mt-2 text-sm text-gray-600">
          {t("jobs.pageInfo", { page: meta.page, totalPages: meta.totalPages, total: meta.total })}
        </p>
      )}
    </div>
  );
};

export default AdminJobsPage;
