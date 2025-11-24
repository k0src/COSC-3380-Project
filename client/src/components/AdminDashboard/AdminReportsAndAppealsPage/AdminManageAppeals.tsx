import { memo, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Appeal, DataTableAction, DataTableBulkAction } from "@types";
import { DataTable, ConfirmationModal } from "@components";
import { adminApi } from "@api";
import {
  appealsColumns,
  appealFilterKeys,
} from "@components/DataTable/columnDefinitions/appealColumns.tsx";
import { LuCheck, LuX, LuTextSearch } from "react-icons/lu";
import { useAuth } from "@contexts";

const AdminManageAppeals: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appealToResolve, setAppealToResolve] = useState<Appeal | null>(null);
  const [appealToDismiss, setAppealToDismiss] = useState<Appeal | null>(null);
  const [appealsToBulkResolve, setAppealsToBulkResolve] = useState<Appeal[]>(
    []
  );
  const [appealsToBulkDismiss, setAppealsToBulkDismiss] = useState<Appeal[]>(
    []
  );

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [isBulkResolveModalOpen, setIsBulkResolveModalOpen] = useState(false);
  const [isBulkDismissModalOpen, setIsBulkDismissModalOpen] = useState(false);

  const refetchRef = useRef<(() => void) | null>(null);

  const fetchAppeals = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return adminApi.getAllAppeals(limit, offset);
    },
    []
  );

  const handleResolveClick = useCallback(
    (appeal: Appeal, refetch: () => void) => {
      setAppealToResolve(appeal);
      setIsResolveModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleDismissClick = useCallback(
    (appeal: Appeal, refetch: () => void) => {
      setAppealToDismiss(appeal);
      setIsDismissModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleViewAppealClick = useCallback(
    (appeal: Appeal) => {
      navigate(`/admin/appeals/${appeal.entity_type}/${appeal.entity_id}`);
    },
    [navigate]
  );

  const handleConfirmResolve = useCallback(async () => {
    if (!appealToResolve || !user) return;
    try {
      await adminApi.resolveAppeal(
        appealToResolve.id,
        appealToResolve.entity_type,
        appealToResolve.entity_id,
        user.id
      );
      setIsResolveModalOpen(false);
      setAppealToResolve(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to resolve appeal:", error);
      throw error;
    }
  }, [appealToResolve, user]);

  const handleConfirmDismiss = useCallback(async () => {
    if (!appealToDismiss || !user) return;

    try {
      await adminApi.dismissAppeal(
        appealToDismiss.id,
        appealToDismiss.entity_type,
        appealToDismiss.entity_id,
        user.id
      );
      setIsDismissModalOpen(false);
      setAppealToDismiss(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to dismiss appeal:", error);
      throw error;
    }
  }, [appealToDismiss, user]);

  const handleBulkResolveClick = useCallback(
    (appeals: Appeal[], refetch: () => void) => {
      setAppealsToBulkResolve(appeals);
      setIsBulkResolveModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleBulkDismissClick = useCallback(
    (appeals: Appeal[], refetch: () => void) => {
      setAppealsToBulkDismiss(appeals);
      setIsBulkDismissModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleConfirmBulkResolve = useCallback(async () => {
    if (appealsToBulkResolve.length === 0 || !user) return;

    try {
      await Promise.all(
        appealsToBulkResolve.map((appeal) =>
          adminApi.resolveAppeal(
            appeal.id,
            appeal.entity_type,
            appeal.entity_id,
            user.id
          )
        )
      );
      setIsBulkResolveModalOpen(false);
      setAppealsToBulkResolve([]);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to bulk resolve appeals:", error);
      throw error;
    }
  }, [appealsToBulkResolve, user]);

  const handleConfirmBulkDismiss = useCallback(async () => {
    if (appealsToBulkDismiss.length === 0 || !user) return;

    try {
      await Promise.all(
        appealsToBulkDismiss.map((appeal) =>
          adminApi.dismissAppeal(
            appeal.id,
            appeal.entity_type,
            appeal.entity_id,
            user.id
          )
        )
      );
      setIsBulkDismissModalOpen(false);
      setAppealsToBulkDismiss([]);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to bulk dismiss appeals:", error);
      throw error;
    }
  }, [appealsToBulkDismiss, user]);

  const actions = useMemo<DataTableAction<Appeal>[]>(
    () => [
      {
        id: "resolve",
        icon: LuCheck,
        label: "Resolve",
        onClick: handleResolveClick,
        disabled: (appeal) => appeal.appeal_status === "RESOLVED",
      },
      {
        id: "dismiss",
        icon: LuX,
        label: "Dismiss",
        onClick: handleDismissClick,
        variant: "danger",
        disabled: (appeal) => appeal.appeal_status === "DISMISSED",
      },
      {
        id: "view",
        icon: LuTextSearch,
        label: "View",
        onClick: handleViewAppealClick,
      },
    ],
    [handleResolveClick, handleDismissClick, handleViewAppealClick]
  );

  const bulkActions = useMemo<DataTableBulkAction<Appeal>[]>(
    () => [
      {
        id: "bulk-resolve",
        icon: LuCheck,
        label: "Resolve",
        onClick: handleBulkResolveClick,
        disabled: (appeal) => appeal.appeal_status === "RESOLVED",
      },
      {
        id: "bulk-dismiss",
        icon: LuX,
        label: "Dismiss",
        onClick: handleBulkDismissClick,
        variant: "danger",
        disabled: (appeal) => appeal.appeal_status === "DISMISSED",
      },
    ],
    [handleBulkResolveClick, handleBulkDismissClick]
  );

  return (
    <>
      <DataTable
        fetchData={fetchAppeals}
        columns={appealsColumns}
        actions={actions}
        bulkActions={bulkActions}
        cacheKey="admin-manage-appeals"
        dependencies={[]}
        initialRowsPerPage={25}
        rowsPerPageOptions={[10, 25, 50, 100]}
        filterKeys={appealFilterKeys}
      />

      <ConfirmationModal
        isOpen={isResolveModalOpen}
        onClose={() => {
          setIsResolveModalOpen(false);
          setAppealToResolve(null);
        }}
        onConfirm={handleConfirmResolve}
        title="Resolve Appeal"
        message="Are you sure you want to resolve this appeal? This will restore the entity to public/active status and resolve all associated reports."
        confirmButtonText="Resolve"
        isDangerous={false}
      />

      <ConfirmationModal
        isOpen={isDismissModalOpen}
        onClose={() => {
          setIsDismissModalOpen(false);
          setAppealToDismiss(null);
        }}
        onConfirm={handleConfirmDismiss}
        title="Dismiss Appeal"
        message="Are you sure you want to dismiss this appeal? This will dismiss all associated reports."
        confirmButtonText="Dismiss"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={isBulkResolveModalOpen}
        onClose={() => {
          setIsBulkResolveModalOpen(false);
          setAppealsToBulkResolve([]);
        }}
        onConfirm={handleConfirmBulkResolve}
        title="Resolve Multiple Appeals"
        message={`Are you sure you want to resolve ${
          appealsToBulkResolve.length
        } appeal${
          appealsToBulkResolve.length === 1 ? "" : "s"
        }? This will restore the entities to public/active status and resolve all associated reports.`}
        confirmButtonText="Resolve All"
        isDangerous={false}
      />

      <ConfirmationModal
        isOpen={isBulkDismissModalOpen}
        onClose={() => {
          setIsBulkDismissModalOpen(false);
          setAppealsToBulkDismiss([]);
        }}
        onConfirm={handleConfirmBulkDismiss}
        title="Dismiss Multiple Appeals"
        message={`Are you sure you want to dismiss ${
          appealsToBulkDismiss.length
        } appeal${
          appealsToBulkDismiss.length === 1 ? "" : "s"
        }? This will dismiss all associated reports.`}
        confirmButtonText="Dismiss All"
        isDangerous={true}
      />
    </>
  );
};

export default memo(AdminManageAppeals);
