import { memo, useState, useMemo, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import type { UserInfo, DataTableAction, DataTableBulkAction } from "@types";
import {
  DataTable,
  ConfirmationModal,
  EditUserModal,
  CreateUserModal,
} from "@components";
import { adminApi } from "@api";
import {
  userColumns,
  userFilterKeys,
} from "@components/DataTable/columnDefinitions/userColumns.js";
import styles from "./AdminDashboardUsersPage.module.css";
import {
  LuUserPlus,
  LuSquarePen,
  LuShieldAlert,
  LuUserX,
} from "react-icons/lu";

const AdminDashboardUsersPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserInfo | null>(null);
  const [userToSuspend, setUserToSuspend] = useState<UserInfo | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<UserInfo | null>(
    null
  );
  const [usersToBulkSuspend, setUsersToBulkSuspend] = useState<UserInfo[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isBulkSuspendModalOpen, setIsBulkSuspendModalOpen] = useState(false);

  const refetchRef = useRef<(() => void) | null>(null);
  const dataTableRefetchRef = useRef<(() => void) | null>(null);

  const fetchUsers = useCallback(
    ({ limit, offset }: { limit: number; offset: number }) => {
      return adminApi.getAllUsers(limit, offset);
    },
    []
  );

  const handleEditClick = useCallback((user: UserInfo, refetch: () => void) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
    refetchRef.current = refetch;
  }, []);

  const handleSuspendClick = useCallback(
    (user: UserInfo, refetch: () => void) => {
      setUserToSuspend(user);
      setIsSuspendModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleDeactivateClick = useCallback(
    (user: UserInfo, refetch: () => void) => {
      setUserToDeactivate(user);
      setIsDeactivateModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleBulkSuspendClick = useCallback(
    (users: UserInfo[], refetch: () => void) => {
      setUsersToBulkSuspend(users);
      setIsBulkSuspendModalOpen(true);
      refetchRef.current = refetch;
    },
    []
  );

  const handleUserEdited = useCallback(() => {
    if (refetchRef.current) {
      refetchRef.current();
    }
  }, []);

  const handleUserCreated = useCallback(() => {
    if (dataTableRefetchRef.current) {
      dataTableRefetchRef.current();
    }
    setIsCreateModalOpen(false);
  }, []);

  const handleConfirmSuspend = useCallback(async () => {
    if (!userToSuspend) return;

    try {
      await adminApi.suspendUser(userToSuspend.id);
      setIsSuspendModalOpen(false);
      setUserToSuspend(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to suspend user:", error);
      throw error;
    }
  }, [userToSuspend]);

  const handleConfirmDeactivate = useCallback(async () => {
    if (!userToDeactivate) return;

    try {
      await adminApi.deactivateUser(userToDeactivate.id);
      setIsDeactivateModalOpen(false);
      setUserToDeactivate(null);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to deactivate user:", error);
      throw error;
    }
  }, [userToDeactivate]);

  const handleConfirmBulkSuspend = useCallback(async () => {
    if (usersToBulkSuspend.length === 0) return;

    try {
      await Promise.all(
        usersToBulkSuspend.map((user) => adminApi.suspendUser(user.id))
      );
      setIsBulkSuspendModalOpen(false);
      setUsersToBulkSuspend([]);
      if (refetchRef.current) {
        refetchRef.current();
      }
    } catch (error) {
      console.error("Failed to bulk suspend users:", error);
      throw error;
    }
  }, [usersToBulkSuspend]);

  const actions = useMemo<DataTableAction<UserInfo>[]>(
    () => [
      {
        id: "edit",
        icon: LuSquarePen,
        label: "Edit User",
        onClick: handleEditClick,
      },
      {
        id: "suspend",
        icon: LuShieldAlert,
        label: "Suspend",
        onClick: handleSuspendClick,
      },
      {
        id: "deactivate",
        icon: LuUserX,
        label: "Deactivate",
        onClick: handleDeactivateClick,
        variant: "danger",
      },
    ],
    [handleEditClick, handleSuspendClick, handleDeactivateClick]
  );

  const bulkActions = useMemo<DataTableBulkAction<UserInfo>[]>(
    () => [
      {
        id: "bulk-suspend",
        icon: LuShieldAlert,
        label: "Suspend Selected",
        onClick: handleBulkSuspendClick,
      },
    ],
    [handleBulkSuspendClick]
  );

  return (
    <>
      <Helmet>
        <title>Manage Users - Admin - CoogMusic</title>
      </Helmet>

      <div className={styles.layout}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.title}>Manage Users</span>
          </div>
          <button
            className={styles.createButton}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <LuUserPlus />
            <span>Create User</span>
          </button>
        </header>

        <div className={styles.tableContainer}>
          <DataTable
            fetchData={fetchUsers}
            columns={userColumns}
            filterKeys={userFilterKeys}
            actions={actions}
            bulkActions={bulkActions}
            theme="dark"
            cacheKey="admin_manage_users"
            dependencies={[]}
            initialRowsPerPage={25}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onRefetchNeeded={dataTableRefetchRef}
          />
        </div>
      </div>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />

      <ConfirmationModal
        isOpen={isSuspendModalOpen}
        onClose={() => {
          setIsSuspendModalOpen(false);
          setUserToSuspend(null);
        }}
        onConfirm={handleConfirmSuspend}
        title="Suspend User"
        message={`Are you sure you want to suspend ${userToSuspend?.username}?`}
        confirmButtonText="Suspend"
        isDangerous={false}
      />

      <ConfirmationModal
        isOpen={isDeactivateModalOpen}
        onClose={() => {
          setIsDeactivateModalOpen(false);
          setUserToDeactivate(null);
        }}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${userToDeactivate?.username}?`}
        confirmButtonText="Deactivate"
        isDangerous={true}
      />

      <ConfirmationModal
        isOpen={isBulkSuspendModalOpen}
        onClose={() => {
          setIsBulkSuspendModalOpen(false);
          setUsersToBulkSuspend([]);
        }}
        onConfirm={handleConfirmBulkSuspend}
        title="Suspend Multiple Users"
        message={`Are you sure you want to suspend ${
          usersToBulkSuspend.length
        } user${usersToBulkSuspend.length === 1 ? "" : "s"}?`}
        confirmButtonText="Suspend All"
        isDangerous={false}
      />

      {userToEdit && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setUserToEdit(null);
          }}
          user={userToEdit}
          onUserEdited={handleUserEdited}
        />
      )}
    </>
  );
};

export default memo(AdminDashboardUsersPage);
