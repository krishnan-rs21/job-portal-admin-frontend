import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  createJob,
  updateJob,
  fetchAdminJobs,
} from "../store/slices/adminJobsSlice";
import { RootState, AppDispatch } from "../store";

const JobFormPage: React.FC = () => {
  const { t } = useTranslation();
  const { uuid } = useParams<{ uuid: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { jobs } = useSelector((state: RootState) => state.adminJobs);
  const { categories, experienceLevels, employmentTypes } = useSelector(
    (state: RootState) => state.meta,
  );

  const job = jobs.find((j) => j.uuid === uuid);
  const [formData, setFormData] = useState(
    job || {
      title: "",
      description: "",
      location: "",
      type: "",
      experience: "",
      categoryId: 0,
    },
  );

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
    <form onSubmit={handleSubmit} className="p-4 bg-white shadow">
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder={t("jobs.title")}
        className="border p-2 w-full mb-2"
      />
      <select
        value={formData.categoryId}
        onChange={(e) =>
          setFormData({ ...formData, categoryId: parseInt(e.target.value) })
        }
      >
        {categories.map((c, i) => (
          <option key={c} value={i + 1}>
            {c}
          </option>
        ))}
      </select>
      <button type="submit" className="bg-blue-500 text-white p-2">
        {t("jobs.submit")}
      </button>
    </form>
  );
};

export default JobFormPage;
