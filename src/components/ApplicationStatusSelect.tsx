import React from "react";
import { useTranslation } from "react-i18next";
import { APPLICATION_STATUSES } from "../store/slices/adminApplicationsSlice";
import type { ApplicationStatus } from "../store/slices/adminApplicationsSlice";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  REVIEWING: "bg-sky-50 text-sky-700 ring-sky-600/20",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

interface ApplicationStatusSelectProps {
  value: ApplicationStatus;
  disabled?: boolean;
  onChange: (status: ApplicationStatus) => void;
}

const ApplicationStatusSelect: React.FC<ApplicationStatusSelectProps> = ({ value, disabled, onChange }) => {
  const { t } = useTranslation();
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as ApplicationStatus)}
      aria-label={t("applications.status")}
      className={`cursor-pointer rounded-full border-0 py-1 pl-3 pr-8 text-xs font-semibold ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-wait disabled:opacity-60 ${
        STATUS_STYLES[value] ?? "bg-slate-100 text-slate-600 ring-slate-500/20"
      }`}
    >
      {APPLICATION_STATUSES.map((status) => (
        <option key={status} value={status}>
          {t(`applications.statuses.${status}`)}
        </option>
      ))}
    </select>
  );
};

export default ApplicationStatusSelect;
