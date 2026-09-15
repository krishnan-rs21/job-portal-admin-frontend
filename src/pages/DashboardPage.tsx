import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminJobs } from "../store/slices/adminJobsSlice";
import { fetchApplications } from "../store/slices/adminApplicationsSlice";
import type { AppDispatch, RootState } from "../store";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import {
  AlertIcon,
  ArchiveIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  MapPinIcon,
  PlusIcon,
  UsersIcon,
} from "../components/Icons";

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, meta, status, error } = useSelector((state: RootState) => state.adminJobs);
  const { admin } = useSelector((state: RootState) => state.auth);
  const { applications, meta: applicationsMeta } = useSelector(
    (state: RootState) => state.adminApplications,
  );

  useEffect(() => {
    dispatch(fetchAdminJobs({ limit: 100 }));
    dispatch(fetchApplications({ params: { limit: 5 } }));
  }, [dispatch]);

  const stats = useMemo(() => {
    const active = jobs.filter((job) => job.isActive).length;
    const byCategory = new Map<string, number>();
    const byType = new Map<string, number>();
    jobs.forEach((job) => {
      byCategory.set(job.category, (byCategory.get(job.category) ?? 0) + 1);
      byType.set(job.type, (byType.get(job.type) ?? 0) + 1);
    });
    const recent = [...jobs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    return {
      active,
      archived: jobs.length - active,
      byCategory: [...byCategory.entries()].sort((a, b) => b[1] - a[1]),
      byType: [...byType.entries()].sort((a, b) => b[1] - a[1]),
      recent,
    };
  }, [jobs]);

  const statCards = [
    {
      label: t("dashboard.totalJobs"),
      value: meta.total || jobs.length,
      icon: BriefcaseIcon,
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      label: t("dashboard.activeJobs"),
      value: stats.active,
      icon: CheckCircleIcon,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: t("dashboard.archivedJobs"),
      value: stats.archived,
      icon: ArchiveIcon,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: t("dashboard.totalApplications"),
      value: applicationsMeta.total,
      icon: UsersIcon,
      tone: "bg-violet-50 text-violet-600",
    },
  ];

  const maxCategoryCount = stats.byCategory[0]?.[1] ?? 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav.dashboard")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("dashboard.welcome", { name: admin?.name || admin?.email || "" })}
          </p>
        </div>
        <Link to="/jobs/create" className="btn-primary">
          <PlusIcon className="h-4 w-4" />
          {t("dashboard.createNewJob")}
        </Link>
      </div>

      {status === "failed" && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertIcon className="h-5 w-5" />
          {error || t("errors.serverError")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {status === "loading" && jobs.length === 0 ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-200" />
              ) : (
                value
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">{t("dashboard.recentJobs")}</h2>
            <Link to="/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              {t("dashboard.viewAll")}
            </Link>
          </div>
          {stats.recent.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              {status === "loading" ? t("jobs.loading") : t("jobs.empty")}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.recent.map((job) => (
                <li key={job.uuid}>
                  <Link
                    to={`/jobs/${job.uuid}/edit`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{job.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                        <span>{job.type}</span>
                        <span>{job.category}</span>
                      </p>
                    </div>
                    <StatusBadge
                      active={job.isActive}
                      label={job.isActive ? t("jobs.active") : t("jobs.archived")}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">{t("dashboard.recentApplications")}</h2>
              <Link to="/applications" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                {t("dashboard.viewAll")}
              </Link>
            </div>
            {applications.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">{t("applications.empty")}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {applications.map((application) => (
                  <li key={application.uuid}>
                    <Link
                      to={application.job ? `/jobs/${application.job.uuid}/applications` : "/applications"}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {`${application.applicant?.firstName ?? ""} ${application.applicant?.lastName ?? ""}`.trim() ||
                            application.applicant?.email}
                        </p>
                        <p className="truncate text-xs text-slate-500">{application.job?.title}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-slate-500">
                        {t(`applications.statuses.${application.status}`)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-slate-900">{t("dashboard.jobsByCategory")}</h2>
            <div className="mt-4 space-y-3">
              {stats.byCategory.length === 0 && (
                <p className="text-sm text-slate-500">{t("jobs.empty")}</p>
              )}
              {stats.byCategory.map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{name}</span>
                    <span className="font-medium text-slate-900">{count}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-slate-900">{t("dashboard.jobsByType")}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {stats.byType.length === 0 && (
                <p className="text-sm text-slate-500">{t("jobs.empty")}</p>
              )}
              {stats.byType.map(([type, count]) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                >
                  {type}
                  <span className="rounded-full bg-white px-1.5 text-xs font-semibold text-slate-900">
                    {count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
