import React from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminJobs,
  toggleJobStatus,
  deleteJob,
} from "../store/slices/adminJobsSlice";
import type { Job } from "../store/slices/adminJobsSlice";
import { setMeta } from "../store";
import type { AppDispatch, RootState } from "../store";
import { fetchMetaData } from "../services/metaService";
import { Link, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBadge from "../components/StatusBadge";
import {
  AlertIcon,
  BriefcaseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UsersIcon,
} from "../components/Icons";

const PAGE_SIZE = 10;

const AdminJobsPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, meta, status, error } = useSelector(
    (state: RootState) => state.adminJobs,
  );
  const { categoryOptions, experienceLevelOptions } = useSelector((state: RootState) => state.meta);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [pendingDelete, setPendingDelete] = useState<Job | null>(null);
  const [busyUuid, setBusyUuid] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const loadJobs = useCallback(() => {
    const params: Record<string, string | number> = {
      ...Object.fromEntries(searchParams),
      page,
      limit: PAGE_SIZE,
    };
    dispatch(fetchAdminJobs(params));
  }, [dispatch, searchParams, page]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (categoryOptions.length > 0) return;
    fetchMetaData()
      .then((data) => dispatch(setMeta(data)))
      .catch(() => undefined);
  }, [dispatch, categoryOptions.length]);

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
    const current = searchParams.get("search") ?? "";
    if (searchInput.trim() === current) return;
    const timer = setTimeout(() => updateParams({ search: searchInput.trim() }), 400);
    return () => clearTimeout(timer);
  }, [searchInput, searchParams, updateParams]);


  const handleToggle = async (job: Job) => {
    setActionError("");
    setBusyUuid(job.uuid);
    const result = await dispatch(toggleJobStatus({ uuid: job.uuid, isActive: !job.isActive }));
    if (toggleJobStatus.rejected.match(result)) {
      setActionError((result.payload as string) || t("errors.serverError"));
    }
    setBusyUuid(null);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    setBusyUuid(pendingDelete.uuid);
    const result = await dispatch(deleteJob(pendingDelete.uuid));
    setBusyUuid(null);
    setPendingDelete(null);
    if (deleteJob.rejected.match(result)) {
      setActionError((result.payload as string) || t("errors.serverError"));
      return;
    }
    if (jobs.length === 1 && page > 1) {
      updateParams({ page: String(page - 1) });
    } else {
      loadJobs();
    }
  };

  const hasFilters = Boolean(
    searchParams.get("search") || searchParams.get("categoryUuid") || searchParams.get("experienceLevelUuid"),
  );
  const totalPages = meta.totalPages || 1;
  const from = meta.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, meta.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("nav.jobs")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("jobs.subtitle")}</p>
        </div>
        <Link to="/jobs/create" className="btn-primary">
          <PlusIcon className="h-4 w-4" />
          {t("dashboard.createNewJob")}
        </Link>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("jobs.searchPlaceholder")}
              className="input pl-9"
            />
          </div>
          <select
            value={searchParams.get("categoryUuid") ?? ""}
            onChange={(e) => updateParams({ categoryUuid: e.target.value })}
            className="input md:col-span-3"
          >
            <option value="">{t("jobs.allCategories")}</option>
            {categoryOptions.map((c) => (
              <option key={c.uuid} value={c.uuid}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={searchParams.get("experienceLevelUuid") ?? ""}
            onChange={(e) => updateParams({ experienceLevelUuid: e.target.value })}
            className="input md:col-span-2"
          >
            <option value="">{t("jobs.allExperience")}</option>
            {experienceLevelOptions.map((option) => (
              <option key={option.uuid} value={option.uuid}>
                {option.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-secondary md:col-span-2"
            disabled={!hasFilters && !searchInput}
            onClick={() => {
              setSearchInput("");
              setSearchParams(new URLSearchParams());
            }}
          >
            {t("jobs.reset")}
          </button>
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
                  {t("jobs.title")}
                </th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                  {t("jobs.category")}
                </th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                  {t("jobs.experience")}
                </th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell">
                  {t("nav.applications")}
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("jobs.status")}
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("jobs.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {status === "loading" &&
                jobs.length === 0 &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4" colSpan={6}>
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))}
              {status !== "loading" && jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <BriefcaseIcon />
                    </div>
                    <p className="mt-3 font-medium text-slate-900">{t("jobs.empty")}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {hasFilters ? t("jobs.emptyFiltered") : t("jobs.emptyHint")}
                    </p>
                  </td>
                </tr>
              )}
              {jobs.map((job) => (
                <tr
                  key={job.uuid}
                  className={`transition hover:bg-slate-50 ${
                    status === "loading" ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{job.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPinIcon className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                      <span>{job.type}</span>
                      {job.salaryRange && <span>{job.salaryRange}</span>}
                    </p>
                  </td>
                  <td className="hidden px-5 py-4 text-sm text-slate-600 md:table-cell">
                    {job.category}
                  </td>
                  <td className="hidden px-5 py-4 text-sm text-slate-600 lg:table-cell">
                    {job.experience}
                  </td>
                  <td className="hidden px-5 py-4 sm:table-cell">
                    <Link
                      to={`/jobs/${job.uuid}/applications`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      <UsersIcon className="h-3.5 w-3.5" />
                      {job.applicationCount ?? 0}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={job.isActive}
                        aria-label={t("jobs.toggle")}
                        title={t("jobs.toggle")}
                        disabled={busyUuid === job.uuid}
                        onClick={() => handleToggle(job)}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition disabled:opacity-50 ${
                          job.isActive ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                            job.isActive ? "left-[18px]" : "left-0.5"
                          }`}
                        />
                      </button>
                      <StatusBadge
                        active={job.isActive}
                        label={job.isActive ? t("jobs.active") : t("jobs.archived")}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/jobs/${job.uuid}/applications`}
                        className="rounded-md p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                        title={t("applications.viewApplications")}
                        aria-label={t("applications.viewApplications")}
                      >
                        <UsersIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/jobs/${job.uuid}/edit`}
                        className="rounded-md p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                        title={t("jobs.edit")}
                        aria-label={t("jobs.edit")}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(job)}
                        className="rounded-md p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                        title={t("jobs.delete")}
                        aria-label={t("jobs.delete")}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 sm:flex-row">
            <p className="text-sm text-slate-600">
              {t("jobs.showing", { from, to, total: meta.total })}
            </p>
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
                {t("jobs.pageInfo", { page: meta.page, totalPages, total: meta.total })}
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("jobs.deleteTitle")}
        message={t("jobs.deleteMessage", { title: pendingDelete?.title ?? "" })}
        confirmLabel={t("jobs.delete")}
        cancelLabel={t("jobs.cancel")}
        loading={busyUuid !== null}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default AdminJobsPage;
