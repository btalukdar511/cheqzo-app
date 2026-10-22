"use client";

import { useState } from "react";
import { flexRender, type ColumnFiltersState, type RowData, type SortingState } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, InboxIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";

export interface DataTableFilter {
  id: string;
  label: string;
  options: string[];
}

interface DataTableProps<TData extends RowData> {
  data: TData[];
  columns: LegacyColumnDef<TData>[];
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  onRowClick?: (row: TData) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<TData extends RowData>({
  data,
  columns,
  searchPlaceholder = "Search",
  filters = [],
  onRowClick,
  emptyTitle = "Nothing here",
  emptyDescription = "Try a different search or filter.",
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  function resetPage() {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  const table = useLegacyTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater);
      resetPage();
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      resetPage();
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
  });

  const rows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const pageStart = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const pageEnd = Math.min(total, (pagination.pageIndex + 1) * pagination.pageSize);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-xs"
          aria-label={searchPlaceholder}
        />
        {filters.map((filter) => (
          <select
            key={filter.id}
            aria-label={filter.label}
            className="h-8 rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
            value={(table.getColumn(filter.id)?.getFilterValue() as string | undefined) ?? ""}
            onChange={(event) => table.getColumn(filter.id)?.setFilterValue(event.target.value || undefined)}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ))}
      </div>
      <div className="overflow-auto rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-border">
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <th key={header.id} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button type="button" className="inline-flex items-center gap-1" onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? <ArrowUpIcon className="size-3" /> : null}
                          {sorted === "desc" ? <ArrowDownIcon className="size-3" /> : null}
                          {sorted === false ? <ChevronsUpDownIcon className="size-3 opacity-40" /> : null}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-6">
                  <EmptyState icon={InboxIcon} title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/70"
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter") onRowClick(row.original);
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {pageStart}–{pageEnd} of {total}
        </span>
        <div className="flex gap-2">
          <button type="button" className="rounded-lg border border-border px-2 py-1 disabled:opacity-40" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </button>
          <button type="button" className="rounded-lg border border-border px-2 py-1 disabled:opacity-40" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
