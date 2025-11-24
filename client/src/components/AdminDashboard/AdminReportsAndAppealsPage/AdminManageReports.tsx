import { memo, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type {
  Report,
  DataTableAction,
  DataTableBulkAction,
  ReportableEntityType,
} from "@types";
import { DataTable, ConfirmationModal } from "@components";
import { adminApi } from "@api";
import {
  reportsColumns,
  reportFilterKeys,
} from "@components/DataTable/columnDefinitions/reportColumns.js";
import { LuCheck, LuX, LuTextSearch } from "react-icons/lu";
import { useAuth } from "@contexts";

const AdminManageReports: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportToResolve, setReportToResolve] = useState<Report | null>(null);
  const [reportToDismiss, setReportToDismiss] = useState<Report | null>(null);
  const [reportsToBulkResolve, setReportsToBulkResolve] = useState<Report[]>(
    []
  );
  const [reportsToBulkDismiss, setReportsToBulkDismiss] = useState<Report[]>(
    []
  );

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [isBulkResolveModalOpen, setIsBulkResolveModalOpen] = useState(false);
  const [isBulkDismissModalOpen, setIsBulkDismissModalOpen] = useState(false);

  const refetchRef = useRef<(() => void) | null>(null);

  const fetchReports = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return adminApi.getAllReports(limit, offset);
    },
    []
  );

  const handleResolveClick = useCallback(
    (report: Report, refetch: () => void) => {
      setReportToResolve(report);
      setIsResolveModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleDismissClick = useCallback(
    (report: Report, refetch: () => void) => {
      setReportToDismiss(report);
      setIsDismissModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleViewAppealClick = useCallback(
    (report: Report) => {
      navigate(`/admin/appeals/${report.entity_type}/${report.reported_id}`);
    },
    [navigate]
  );

  const handleConfirmResolve = useCallback(async () => {
    if (!reportToResolve || !user) return;

    try {
      await adminApi.resolveReport(
        reportToResolve.id,
        reportToResolve.entity_type as ReportableEntityType,
        reportToResolve.reported_id,
        user.id
      );
      setIsResolveModalOpen(false);
      setReportToResolve(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to resolve report:", error);
      throw error;
    }
  }, [reportToResolve, user]);

  const handleConfirmDismiss = useCallback(async () => {
    if (!reportToDismiss || !user) return;

    try {
      await adminApi.dismissReport(
        reportToDismiss.id,
        reportToDismiss.entity_type as ReportableEntityType,
        reportToDismiss.reported_id,
        user.id
      );
      setIsDismissModalOpen(false);
      setReportToDismiss(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to dismiss report:", error);
      throw error;
    }
  }, [reportToDismiss, user]);

  const handleBulkResolveClick = useCallback(
    (reports: Report[], refetch: () => void) => {
      setReportsToBulkResolve(reports);
      setIsBulkResolveModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleBulkDismissClick = useCallback(
    (reports: Report[], refetch: () => void) => {
      setReportsToBulkDismiss(reports);
      setIsBulkDismissModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleConfirmBulkResolve = useCallback(async () => {
    if (reportsToBulkResolve.length === 0 || !user) return;

    try {
      await Promise.all(
        reportsToBulkResolve.map((report) =>
          adminApi.resolveReport(
            report.id,
            report.entity_type as ReportableEntityType,
            report.reported_id,
            user.id
          )
        )
      );
      setIsBulkResolveModalOpen(false);
      setReportsToBulkResolve([]);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to bulk resolve reports:", error);
      throw error;
    }
  }, [reportsToBulkResolve, user]);

  const handleConfirmBulkDismiss = useCallback(async () => {
    if (reportsToBulkDismiss.length === 0 || !user) return;

    try {
      await Promise.all(
        reportsToBulkDismiss.map((report) =>
          adminApi.dismissReport(
            report.id,
            report.entity_type as ReportableEntityType,
            report.reported_id,
            user.id
          )
        )
      );
      setIsBulkDismissModalOpen(false);
      setReportsToBulkDismiss([]);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to bulk dismiss reports:", error);
      throw error;
    }
  }, [reportsToBulkDismiss, user]);

  const actions = useMemo<DataTableAction<Report>[]>(
    () => [
      {
        id: "resolve",
        icon: LuCheck,
        label: "Resolve",
        onClick: handleResolveClick,
        disabled: (report) => report.report_status === "RESOLVED",
      },
      {
        id: "dismiss",
        icon: LuX,
        label: "Dismiss",
        onClick: handleDismissClick,
        variant: "danger",
        disabled: (report) => report.report_status === "DISMISSED",
      },
      {
        id: "view-appeal",
        icon: LuTextSearch,
        label: "View",
        onClick: handleViewAppealClick,
      },
    ],
    [handleResolveClick, handleDismissClick, handleViewAppealClick]
  );

  const bulkActions = useMemo<DataTableBulkAction<Report>[]>(
    () => [
      {
        id: "bulk-resolve",
        icon: LuCheck,
        label: "Resolve",
        onClick: handleBulkResolveClick,
        disabled: (report) => report.report_status === "RESOLVED",
      },
      {
        id: "bulk-dismiss",
        icon: LuX,
        label: "Dismiss",
        onClick: handleBulkDismissClick,
        variant: "danger",
        disabled: (report) => report.report_status === "DISMISSED",
      },
    ],
    [handleBulkResolveClick, handleBulkDismissClick]
  );

  return (
    <>
      <DataTable
        fetchData={fetchReports}
        columns={reportsColumns}
        actions={actions}
        bulkActions={bulkActions}
        cacheKey="admin-manage-reports"
        dependencies={[]}
        initialRowsPerPage={25}
        rowsPerPageOptions={[10, 25, 50, 100]}
        filterKeys={reportFilterKeys}
      />

      <ConfirmationModal
        isOpen={isResolveModalOpen}
        onClose={() => {
          setIsResolveModalOpen(false);
          setReportToResolve(null);
        }}
        onConfirm={handleConfirmResolve}
        title="Resolve Report"
        message="Are you sure you want to resolve this report? This will restore the entity to public/active status and resolve all associated appeals."
        confirmButtonText="Resolve"
        isDangerous={false}
      />

      <ConfirmationModal
        isOpen={isDismissModalOpen}
        onClose={() => {
          setIsDismissModalOpen(false);
          setReportToDismiss(null);
        }}
        onConfirm={handleConfirmDismiss}
        title="Dismiss Report"
        message="Are you sure you want to dismiss this report? This will dismiss all associated appeals."
        confirmButtonText="Dismiss"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={isBulkResolveModalOpen}
        onClose={() => {
          setIsBulkResolveModalOpen(false);
          setReportsToBulkResolve([]);
        }}
        onConfirm={handleConfirmBulkResolve}
        title="Resolve Multiple Reports"
        message={`Are you sure you want to resolve ${
          reportsToBulkResolve.length
        } report${
          reportsToBulkResolve.length === 1 ? "" : "s"
        }? This will restore the entities to public/active status and resolve all associated appeals.`}
        confirmButtonText="Resolve All"
        isDangerous={false}
      />

      <ConfirmationModal
        isOpen={isBulkDismissModalOpen}
        onClose={() => {
          setIsBulkDismissModalOpen(false);
          setReportsToBulkDismiss([]);
        }}
        onConfirm={handleConfirmBulkDismiss}
        title="Dismiss Multiple Reports"
        message={`Are you sure you want to dismiss ${
          reportsToBulkDismiss.length
        } report${
          reportsToBulkDismiss.length === 1 ? "" : "s"
        }? This will dismiss all associated appeals.`}
        confirmButtonText="Dismiss All"
        isDangerous={true}
      />
    </>
  );
};

export default memo(AdminManageReports);
