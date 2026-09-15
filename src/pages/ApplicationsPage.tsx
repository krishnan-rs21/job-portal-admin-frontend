import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { AppDispatch, RootState } from "../store";
import { fetchAdminJobByUuid } from "../store/slices/adminJobsSlice";
import {
  APPLICATION_STATUSES,
  fetchApplications,
  updateApplicationStatus,
} from "../store/slices/adminApplicationsSlice";
import type { ApplicationStatus } from "../store/slices/adminApplicationsSlice";
import ApplicationStatusSelect from "../components/ApplicationStatusSelect";
import StatusBadge from "../components/StatusBadge";
import {
  AlertIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  MailIcon,
  MapPinIcon,
  SearchIcon,
  UsersIcon,
} from "../components/Icons";

const PAGE_SIZE = 10;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const ApplicationsPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { uuid } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { applications, meta, status, error, updatingUuid } = useSelector(
    (state: RootState) => state.adminApplications,
  );
  const job = useSelector((state: RootState) =>
    uuid ? state.adminJobs.jobs.find((j) => j.uuid === uuid) : undefined,
  );
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [actionError, setActionError] = useState("");

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const statusFilter = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";

  const loadApplications = useCallback(() => {
    const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
    if (statusFilter) params.status = statusFilter;
    if (search) params.search = search;
    dispatch(fetchApplications({ jobUuid: uuid, params }));
  }, [dispatch, uuid, page, statusFilter, search]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (uuid && !job) dispatch(fetchAdminJobByUuid(uuid));
  }, [dispatch, uuid, job]);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      if (!("page" in updates)) next.delete("page");
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timer = setTimeout(() => updateParams({ search: searchInput.trim() }), 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, updateParams]);

  const handleStatusChange = async (applicationUuid: string, nextStatus: ApplicationStatus) => {
    setActionError("");
    const result = await dispatch(updateApplicationStatus({ uuid: applicationUuid, status: nextStatus }));
    if (updateApplicationStatus.rejected.match(result)) {
      setActionError((result.payload as string) || t("errors.serverError"));
    }
  };

  const allCount = APPLICATION_STATUSES.reduce((sum, key) => sum + (meta.statusCounts[key] ?? 0), 0);
  const totalPages = meta.totalPages || 1;
  const from = meta.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, meta.total);
  const columnCount = uuid ? 4 : 5;

  const tabs = [
    { key: "", label: t("applications.statuses.ALL"), count: allCount },
    ...APPLICATION_STATUSES.map((key) => ({
      key,
      label: t(`applications.statuses.${key}`),
      count: meta.statusCounts[key] ?? 0,
    })),
  ];

  return (
    <div className="space-y-6">
      <div>
        {uuid && (
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t("jobs.backToJobs")}
          </Link>
        )}
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">
              {uuid ? job?.title ?? t("applications.title") : t("applications.title")}
            </h1>
            {uuid && job ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  {job.location}
                </span>
                <span>{job.type}</span>
                <span>{job.experience}</span>
                {job.category && <span>{job.category}</span>}
                <StatusBadge
                  active={job.isActive}
                  label={job.isActive ? t("jobs.active") : t("jobs.archived")}
                />
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">{t("applications.subtitle")}</p>
            )}
          </div>
          {uuid && (
            <Link to={`/jobs/${uuid}/edit`} className="btn-secondary">
              <EditIcon className="h-4 w-4" />
              {t("jobs.editJob")}
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tabs.map((tab) => (
          <button
            key={tab.key || "ALL"}
            type="button"
            onClick={() => updateParams({ status: tab.key })}
            className={`card px-4 py-3 text-left transition ${
              statusFilter === tab.key
                ? "border-indigo-500 ring-2 ring-indigo-500/20"
                : "hover:border-slate-300"
            }`}
          >
            <p className="text-xs font-medium text-slate-500">{tab.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{tab.count}</p>
          </button>
        ))}
      </div>

      <div className="card p-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={uuid ? t("applications.searchApplicant") : t("applications.searchPlaceholder")}
            className="input pl-9"
          />
        </div>
      </div>

      {(actionError || status === "failed") && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertIcon className="h-5 w-5 shrink-0" />
          {actionError || error || t("errors.serverError")}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("applications.applicant")}
                </th>
                {!uuid && (
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                    {t("applications.job")}
                  </th>
                )}
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">
                  {t("applications.appliedOn")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("applications.status")}
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("jobs.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {status === "loading" &&
                applications.length === 0 &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4" colSpan={columnCount}>
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))}
              {status !== "loading" && applications.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <UsersIcon />
                    </div>
                    <p className="mt-3 font-medium text-slate-900">{t("applications.empty")}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {statusFilter || search ? t("jobs.emptyFiltered") : t("applications.emptyHint")}
                    </p>
                  </td>
                </tr>
              )}
              {applications.map((application) => {
                const applicant = application.applicant;
                const fullName = `${applicant?.firstName ?? ""} ${applicant?.lastName ?? ""}`.trim();
                const initials = (fullName || applicant?.email || "?")
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join("");
                return (
                  <tr
                    key={application.uuid}
                    className={`transition hover:bg-slate-50 ${status === "loading" ? "opacity-60" : ""}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{fullName || "—"}</p>
                          <p className="truncate text-xs text-slate-500">{applicant?.email}</p>
                        </div>
                      </div>
                    </td>
                    {!uuid && (
                      <td className="hidden px-5 py-4 md:table-cell">
                        {application.job ? (
                          <Link
                            to={`/jobs/${application.job.uuid}/applications`}
                            className="font-medium text-slate-700 hover:text-indigo-600"
                          >
                            {application.job.title}
                          </Link>
                        ) : (
                          "—"
                        )}
                        {application.job && (
                          <p className="text-xs text-slate-500">{application.job.location}</p>
                        )}
                      </td>
                    )}
                    <td className="hidden px-5 py-4 text-sm text-slate-600 sm:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                        {formatDate(application.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <ApplicationStatusSelect
                        value={application.status}
                        disabled={updatingUuid === application.uuid}
                        onChange={(next) => handleStatusChange(application.uuid, next)}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        {applicant?.email && (
                          <a
                            href={`mailto:${applicant.email}`}
                            className="rounded-md p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                            title={t("applications.email")}
                            aria-label={t("applications.email")}
                          >
                            <MailIcon className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {meta.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 sm:flex-row">
            <p className="text-sm text-slate-600">{t("jobs.showing", { from, to, total: meta.total })}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary px-2.5"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
                aria-label={t("jobs.prev")}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="text-sm text-slate-600">
                {t("applications.pageInfo", { page, totalPages })}
              </span>
              <button
                type="button"
                className="btn-secondary px-2.5"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
                aria-label={t("jobs.next")}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsPage;
