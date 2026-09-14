import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminJobs,
  toggleJobStatus,
  deleteJob,
} from "../store/slices/adminJobsSlice";
import { RootState, AppDispatch } from "../store";
import { Link, useSearchParams } from "react-router-dom";

const AdminJobsPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, meta, status } = useSelector(
    (state: RootState) => state.adminJobs,
  );
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    dispatch(fetchAdminJobs(Object.fromEntries(searchParams)));
  }, [dispatch, searchParams]);

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("nav.jobs")}</h1>
      {/* Filters (simplified for brevity) */}
      <table className="w-full bg-white shadow mt-4">
        <thead>
          <tr>
            <th>{t("jobs.title")}</th>
            <th>{t("jobs.status")}</th>
            <th>{t("jobs.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.uuid}>
              <td>{job.title}</td>
              <td>{job.isActive ? t("jobs.active") : t("jobs.archived")}</td>
              <td>
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
    </div>
  );
};

export default AdminJobsPage;
