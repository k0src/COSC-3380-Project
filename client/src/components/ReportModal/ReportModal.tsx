import { useState, memo, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@contexts";
import { Link } from "react-router-dom";
import { reportApi } from "@api";
import type { UUID, ReportableEntity, ReportType } from "@types";
import {
  SettingsDropdown,
  SettingsTextArea,
  SettingsCheckbox,
} from "@components";
import styles from "./ReportModal.module.css";
import { LuX } from "react-icons/lu";

interface ReportForm {
  reportType: ReportType;
  description: string;
  confirmed: boolean;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => Promise<void>;
  reportedId: UUID;
  reportedTitle?: string;
  reportedType: ReportableEntity;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  reportedId,
  reportedTitle,
  reportedType,
}) => {
  const { user } = useAuth();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState: ReportForm = useMemo(
    () => ({
      reportType: "EXPLICIT",
      description: "",
      confirmed: false,
    }),
    []
  );

  const reportTypeOptions = useMemo(
    () => [
      { value: "EXPLICIT", label: "Explicit Content" },
      { value: "VIOLENT", label: "Violent or Graphic Content" },
      { value: "HATEFUL", label: "Hateful or Abusive Content" },
      { value: "COPYRIGHT", label: "Copyright Infringement" },
    ],
    []
  );

  const [reportForm, setReportForm] = useState<ReportForm>(initialFormState);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setReportForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      if (error) {
        setError("");
      }
    },
    [error]
  );

  const handleDropdownChange = useCallback(
    (name: string, value: string) => {
      setReportForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      if (error) {
        setError("");
      }
    },
    [error]
  );

  const handleCheckboxChange = useCallback(
    (name: string, checked: boolean) => {
      setReportForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
      if (error) {
        setError("");
      }
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!reportForm.reportType) {
        setError("Please select a report type.");
        return;
      }

      if (!reportForm.description.trim()) {
        setError("Please provide a description of your report.");
        return;
      }

      if (!reportForm.confirmed) {
        setError("Please confirm that the information provided is accurate.");
        return;
      }

      setIsSubmitting(true);
      setError("");

      try {
        const reportData: any = {
          reporter_id: user?.id,
          reported_id: reportedId,
          report_type: reportForm.reportType,
          description: reportForm.description.trim(),
        };

        await reportApi.submit(reportedType, reportData);

        onSubmit?.();
        onClose();
      } catch (error: any) {
        console.error("Report error:", error);
        const errorMessage =
          error.response?.data?.error || `Failed to report ${reportedType}.`;
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [reportForm, user, reportedId, reportedType, onSubmit, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setError("");
      setReportForm(initialFormState);
    }
  }, [isOpen]);

  if (!user) return null;
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>
            Report {reportedTitle ? `"${reportedTitle}"` : reportedType}
          </span>
          <button className={styles.headerButton} onClick={onClose}>
            <LuX />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.warningBanner}>
            Please provide details about why you are reporting this{" "}
            {reportedType}. Reported content is reviewed according to our{" "}
            <Link to="/guidelines" className={styles.messageLink}>
              content guidelines
            </Link>{" "}
            and{" "}
            <Link to="/terms-of-service" className={styles.messageLink}>
              terms of service
            </Link>
            . Repeated violations may lead to account suspension or removal.
          </div>

          <form className={styles.reportForm} onSubmit={handleSubmit}>
            <SettingsDropdown
              label="Report Type"
              name="reportType"
              value={reportForm.reportType}
              options={reportTypeOptions}
              onChange={(value) => handleDropdownChange("reportType", value)}
              hint="Select the type of issue you are reporting."
              placeholder="Select Report Type"
              disabled={isSubmitting}
              required={true}
            />
            <SettingsTextArea
              label="Description"
              name="description"
              value={reportForm.description}
              onChange={handleInputChange}
              placeholder="Please provide details about your report..."
              disabled={isSubmitting}
              required={true}
            />
            <SettingsCheckbox
              label="I confirm that the information provided is accurate."
              name="confirmed"
              checked={reportForm.confirmed}
              onChange={(checked) => handleCheckboxChange("confirmed", checked)}
              disabled={isSubmitting}
              required={true}
            />
            <div className={styles.buttonContainer}>
              {error && <span className={styles.error}>{error}</span>}
              <div className={styles.buttons}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default memo(ReportModal);
