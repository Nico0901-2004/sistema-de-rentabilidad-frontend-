import { useEffect, useMemo, useState } from "react";

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  error = "",
  emptyMessage = "No hay datos",
  emptyIcon,
  rowKey,
  actions,
  renderActions,
  filters,
  cardClassName = "",
  tableClassName = "",
  skeletonRows = 4,
  pageSize = 6,
  paginated = true,
  onRowClick,
  rowClassName,
  rowStyle,
}) => {
  const actionRenderer = actions || renderActions;
  const colSpan = columns.length + (actionRenderer ? 1 : 0);
  const [page, setPage] = useState(1);
  const totalPages = paginated && pageSize > 0 ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;

  useEffect(() => {
    setPage(1);
  }, [data.length, pageSize]);

  const visibleData = useMemo(() => {
    if (!paginated || pageSize <= 0) return data;
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize, paginated]);

  const getRowKey = (row, index) => {
    if (typeof rowKey === "function") return rowKey(row, index);
    if (typeof rowKey === "string") return row[rowKey];
    return row?.id || row?.id_usuario || row?.id_proyecto || row?.id_servicio || row?.id_fase || row?.id_nota || index;
  };

  const getCellValue = (row, col) => {
    if (col.render) return col.render(row);
    if (typeof col.accessor === "function") return col.accessor(row);
    return row[col.accessor];
  };

  return (
    <>
      {filters && <div className="mb-3">{filters}</div>}

      {error && (
        <div className="alert alert-danger d-flex align-items-center small rounded-3">
          <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
        </div>
      )}

      <div className={`card border-0 rounded-4 overflow-hidden ${cardClassName}`} style={{ boxShadow: "var(--shadow-md)" }}>
        <div className="table-responsive app-table-scroll">
          <table className={`table table-modern mb-0 ${tableClassName}`}>
            <thead>
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={col.key || col.accessor || index}
                    className={col.headerClassName || col.className || ""}
                    style={col.style}
                  >
                    {col.header}
                  </th>
                ))}
                {actionRenderer && (
                  <th className="text-end" style={{ width: 132, minWidth: 132 }}>
                    Acciones
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {Array.from({ length: colSpan }).map((__, j) => (
                      <td key={j}>
                        <div className="skeleton rounded" style={{ height: 20, width: j === 0 ? "55%" : "80%" }}></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : visibleData.length > 0 ? (
                visibleData.map((row, i) => (
                  <tr
                    key={getRowKey(row, (page - 1) * pageSize + i)}
                    className={`${typeof rowClassName === "function" ? rowClassName(row) : rowClassName || ""} ${onRowClick ? "cursor-pointer" : ""}`.trim()}
                    style={typeof rowStyle === "function" ? rowStyle(row) : rowStyle}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col, j) => (
                      <td key={col.key || col.accessor || j} className={col.cellClassName} style={col.cellStyle}>
                        {getCellValue(row, col)}
                      </td>
                    ))}

                    {actionRenderer && (
                      <td className="text-end" style={{ width: 132, minWidth: 132, whiteSpace: "nowrap" }} onClick={(event) => event.stopPropagation()}>
                        {actionRenderer(row)}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={colSpan}>
                    <div className="empty-state">
                      {emptyIcon && <i className={`bi ${emptyIcon}`}></i>}
                      <h6>{emptyMessage}</h6>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {paginated && data.length > pageSize && !loading && (
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2 table-pagination">
          <span className="text-muted small">
            Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, data.length)} de {data.length}
          </span>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-light fw-semibold" type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
              <i className="bi bi-chevron-left"></i>
            </button>
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  className={`btn fw-semibold ${pageNumber === page ? "btn-primary" : "btn-light"}`}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button className="btn btn-light fw-semibold" type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DataTable;
