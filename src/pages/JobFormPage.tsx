import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { createJob, updateJob } from "../store/slices/adminJobsSlice";
import { setMeta } from "../store";
import { fetchMetaData } from "../services/metaService";
import type { AppDispatch, RootState } from "../store";

const JobFormPage: React.FC = () => {
  const { t } = useTranslation();
  const { uuid } = useParams<{ uuid: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { jobs } = useSelector((state: RootState) => state.adminJobs);
  const { categories, experienceLevels, employmentTypes } = useSelector(
    (state: RootState) => state.meta,
  );

  useEffect(() => {
    fetchMetaData().then((data) => {
      dispatch(setMeta(data));
    });
  }, [dispatch]);

  const job = jobs.find((j) => j.uuid === uuid);
  const [formData, setFormData] = useState({
    title: job?.title ?? "",
    description: job?.description ?? "",
    location: job?.location ?? "",
    type: job?.type ?? "",
    experience: job?.experience ?? "",
    categoryId: job?.categoryId ?? 0,
    salaryRange: job?.salaryRange ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uuid) {
      await dispatch(updateJob({ uuid, data: formData }));
    } else {
      await dispatch(createJob(formData));
    }
    navigate("/jobs");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white shadow space-y-3">
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder={t("jobs.title")}
        className="border p-2 w-full"
        required
      />
      <textarea
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder={t("jobs.description")}
        className="border p-2 w-full"
      />
      <input
        type="text"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        placeholder={t("jobs.location")}
        className="border p-2 w-full"
      />
      <select
        value={formData.categoryId}
        onChange={(e) =>
          setFormData({ ...formData, categoryId: parseInt(e.target.value, 10) })
        }
        className="border p-2 w-full"
      >
        <option value={0}>{t("jobs.category")}</option>
        {categories.map((c, i) => (
          <option key={c} value={i + 1}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        className="border p-2 w-full"
      >
        <option value="">{t("jobs.type")}</option>
        {employmentTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <select
        value={formData.experience}
        onChange={(e) =>
          setFormData({ ...formData, experience: e.target.value })
        }
        className="border p-2 w-full"
      >
        <option value="">{t("jobs.experience")}</option>
        {experienceLevels.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={formData.salaryRange}
        onChange={(e) =>
          setFormData({ ...formData, salaryRange: e.target.value })
        }
        placeholder={t("jobs.salaryRange")}
        className="border p-2 w-full"
      />
      <button type="submit" className="bg-blue-500 text-white p-2">
        {t("jobs.submit")}
      </button>
    </form>
  );
};

export default JobFormPage;
