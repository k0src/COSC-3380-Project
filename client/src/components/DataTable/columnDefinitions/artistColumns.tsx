import { Link } from "react-router-dom";
import type { Artist, DataTableColumn } from "@types";
import { LuCheck } from "react-icons/lu";

export const artistColumns: DataTableColumn<Artist>[] = [
  {
    key: "display_name",
    header: "Display Name",
    sortable: true,
    width: "flex",
    render: (value, row) => (
      <Link
        to={`/artists/${row.id}`}
        style={{
          color: "var(--color-white)",
          textDecoration: "none",
          fontWeight: 500,
          transition: "color 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-xs)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--color-accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--color-white)";
        }}
      >
        {value}
        {row.verified && (
          <LuCheck
            style={{
              color: "var(--color-accent)",
              fontSize: "var(--icon-size-sm)",
            }}
          />
        )}
      </Link>
    ),
  },
  {
    key: "bio",
    header: "Bio",
    width: "flex",
    render: (value) => (
      <span
        style={{
          color: "var(--color-text-gray)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value || "—"}
      </span>
    ),
  },
  {
    key: "verified",
    header: "Verified",
    sortable: true,
    width: 80,
    align: "center",
    render: (value) =>
      value ? (
        <LuCheck
          style={{
            color: "var(--color-accent)",
            fontSize: "var(--icon-size-md)",
          }}
        />
      ) : null,
  },
  {
    key: "location",
    header: "Location",
    sortable: true,
    width: "flex",
    render: (value) => (
      <span style={{ color: "var(--color-white-alt)" }}>{value || "—"}</span>
    ),
  },
  {
    key: "user",
    header: "Username",
    width: "flex",
    render: (value) => (
      <Link
        to={`/users/${value?.id}`}
        style={{
          color: "var(--color-white-alt)",
          textDecoration: "none",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--color-accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--color-white-alt)";
        }}
      >
        {value?.username || "—"}
      </Link>
    ),
  },
];

export const artistFilterKeys = ["display_name", "bio", "location"];
