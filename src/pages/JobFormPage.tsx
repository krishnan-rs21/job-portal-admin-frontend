import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import { createJob, fetchAdminJobByUuid, updateJob } from "../store/slices/adminJobsSlice";
import type { Job } from "../store/slices/adminJobsSlice";
import { setMeta } from "../store";
import { fetchMetaData } from "../services/metaService";
import type { AppDispatch, RootState } from "../store";
import { AlertIcon, ArrowLeftIcon } from "../components/Icons";

type FormData = {
  title: string;
  description: string;
  location: string;
  employmentTypeUuid: string;
  experienceLevelUuid: string;
  categoryUuid: string;
  salaryRange: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const toFormData = (job?: Job): FormData => ({
  title: job?.title ?? "",
  description: job?.description ?? "",
  location: job?.location ?? "",
  employmentTypeUuid: job?.employmentTypeUuid ?? "",
  experienceLevelUuid: job?.experienceLevelUuid ?? "",
  categoryUuid: job?.categoryUuid ?? "",
  salaryRange: job?.salaryRange ?? "",
});

const JobFormPage: React.FC = () => {
  const { t } = useTranslation();
  const { uuid } = useParams<{ uuid: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { jobs } = useSelector((state: RootState) => state.adminJobs);
  const { categoryOptions, experienceLevelOptions, employmentTypeOptions } = useSelector(
    (state: RootState) => state.meta,
  );

  const job = jobs.find((j) => j.uuid === uuid);
  const [formData, setFormData] = useState<FormData>(toFormData(job));
  const [loadedUuid, setLoadedUuid] = useState<string | undefined>(job?.uuid);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingJob, setLoadingJob] = useState(Boolean(uuid && !job));
  const [metaError, setMetaError] = useState("");

  useEffect(() => {
    fetchMetaData()
      .then((data) => {
        dispatch(setMeta(data));
      })
      .catch(() => setMetaError(t("errors.metaFailed")));
  }, [dispatch, t]);

  if (job && job.uuid !== loadedUuid) {
    setLoadedUuid(job.uuid);
    setFormData(toFormData(job));
  }

  useEffect(() => {
    if (!uuid || job) return;
    dispatch(fetchAdminJobByUuid(uuid)).then((result) => {
      if (fetchAdminJobByUuid.rejected.match(result)) {
        setSubmitError((result.payload as string) || t("errors.serverError"));
      }
      setLoadingJob(false);
    });
  }, [dispatch, uuid, job, t]);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next: FormErrors = {};
    if (!formData.title.trim()) next.title = t("jobs.required");
    if (!formData.description.trim()) next.description = t("jobs.required");
    if (!formData.location.trim()) next.location = t("jobs.required");
    if (!formData.categoryUuid) next.categoryUuid = t("jobs.required");
    if (!formData.employmentTypeUuid) next.employmentTypeUuid = t("jobs.required");
    if (!formData.experienceLevelUuid) next.experienceLevelUuid = t("jobs.required");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      employmentTypeUuid: formData.employmentTypeUuid,
      experienceLevelUuid: formData.experienceLevelUuid,
      categoryUuid: formData.categoryUuid,
      ...(formData.salaryRange.trim() ? { salaryRange: formData.salaryRange.trim() } : {}),
    };

    setSubmitting(true);
    const result = uuid
      ? await dispatch(updateJob({ uuid, data: payload }))
      : await dispatch(createJob(payload));
    setSubmitting(false);

    if (result.meta.requestStatus === "rejected") {
      setSubmitError((result.payload as string) || t("errors.serverError"));
      return;
    }
    navigate("/jobs");
  };

  const fieldClass = (key: keyof FormData) =>
    `input ${errors[key] ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15" : ""}`;

  const fieldError = (name: keyof FormData) =>
    errors[name] ? <p className="mt-1 text-xs text-rose-600">{errors[name]}</p> : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t("jobs.backToJobs")}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          {uuid ? t("jobs.editJob") : t("dashboard.createNewJob")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {uuid ? t("jobs.editSubtitle") : t("jobs.createSubtitle")}
        </p>
      </div>

      {(submitError || metaError) && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertIcon className="h-5 w-5 shrink-0" />
          {submitError || metaError}
        </div>
      )}

      {loadingJob ? (
        <div className="card space-y-4 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card divide-y divide-slate-200" noValidate>
          <div className="space-y-5 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t("jobs.basicInfo")}
            </h2>
            <div>
              <label htmlFor="title" className="label">
                {t("jobs.title")} <span className="text-rose-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder={t("jobs.titlePlaceholder")}
                className={fieldClass("title")}
                required
              />
              {fieldError("title")}
            </div>
            <div>
              <label htmlFor="description" className="label">
                {t("jobs.description")} <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="description"
                rows={6}
                value={formData.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder={t("jobs.descriptionPlaceholder")}
                className={`${fieldClass("description")} resize-y`}
              />
              {fieldError("description")}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2">
              {t("jobs.details")}
            </h2>
            <div>
              <label htmlFor="location" className="label">
                {t("jobs.location")} <span className="text-rose-500">*</span>
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder={t("jobs.locationPlaceholder")}
                className={fieldClass("location")}
              />
              {fieldError("location")}
            </div>
            <div>
              <label htmlFor="categoryUuid" className="label">
                {t("jobs.category")} <span className="text-rose-500">*</span>
              </label>
              <select
                id="categoryUuid"
                value={formData.categoryUuid}
                onChange={(e) => update("categoryUuid", e.target.value)}
                className={fieldClass("categoryUuid")}
              >
                <option value="">{t("jobs.selectCategory")}</option>
                {categoryOptions.map((c) => (
                  <option key={c.uuid} value={c.uuid}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldError("categoryUuid")}
            </div>
            <div>
              <label htmlFor="employmentTypeUuid" className="label">
                {t("jobs.type")} <span className="text-rose-500">*</span>
              </label>
              <select
                id="employmentTypeUuid"
                value={formData.employmentTypeUuid}
                onChange={(e) => update("employmentTypeUuid", e.target.value)}
                className={fieldClass("employmentTypeUuid")}
              >
                <option value="">{t("jobs.selectType")}</option>
                {employmentTypeOptions.map((option) => (
                  <option key={option.uuid} value={option.uuid}>
                    {option.name}
                  </option>
                ))}
              </select>
              {fieldError("employmentTypeUuid")}
            </div>
            <div>
              <label htmlFor="experienceLevelUuid" className="label">
                {t("jobs.experience")} <span className="text-rose-500">*</span>
              </label>
              <select
                id="experienceLevelUuid"
                value={formData.experienceLevelUuid}
                onChange={(e) => update("experienceLevelUuid", e.target.value)}
                className={fieldClass("experienceLevelUuid")}
              >
                <option value="">{t("jobs.selectExperience")}</option>
                {experienceLevelOptions.map((option) => (
                  <option key={option.uuid} value={option.uuid}>
                    {option.name}
                  </option>
                ))}
              </select>
              {fieldError("experienceLevelUuid")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="salaryRange" className="label">
                {t("jobs.salaryRange")}{" "}
                <span className="font-normal text-slate-400">({t("jobs.optional")})</span>
              </label>
              <input
                id="salaryRange"
                type="text"
                value={formData.salaryRange}
                onChange={(e) => update("salaryRange", e.target.value)}
                placeholder={t("jobs.salaryPlaceholder")}
                className="input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4">
            <Link to="/jobs" className="btn-secondary">
              {t("jobs.cancel")}
            </Link>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {uuid ? t("jobs.saveChanges") : t("jobs.submit")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default JobFormPage;
