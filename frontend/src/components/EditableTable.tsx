import React from 'react'

export interface TableRow {
  item: string
  values: Record<string, string>
}

interface Props<T extends TableRow> {
  rows: T[]
  productIds: string[]
  productNames: Record<string, string>
  recommendedId: string
  onChange: (rows: T[]) => void
  readOnly?: boolean
}

function EditableTable<T extends TableRow>({
  rows, productIds, productNames, recommendedId, onChange, readOnly = false,
}: Props<T>) {
  const handleCell = (rowIdx: number, pid: string, val: string) => {
    const next = rows.map((r, i) =>
      i === rowIdx ? { ...r, values: { ...r.values, [pid]: val } } : r
    )
    onChange(next)
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="comparison-table">
        <thead>
          <tr>
            <th style={{ minWidth: 120 }}>对比项</th>
            {productIds.map((pid) => (
              <th key={pid} style={{ minWidth: 160 }}>
                {productNames[pid]}
                {pid === recommendedId && (
                  <span className="recommended-badge">推荐</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{row.item}</td>
              {productIds.map((pid) => {
                const val = row.values[pid] ?? ''
                const multiline = val.length > 40 || val.includes('\n')
                return (
                  <td key={pid}>
                    {multiline ? (
                      <textarea
                        value={val}
                        rows={Math.min(6, val.split('\n').length + 1)}
                        readOnly={readOnly}
                        onChange={readOnly ? undefined : (e) => handleCell(i, pid, e.target.value)}
                      />
                    ) : (
                      <input
                        value={val}
                        readOnly={readOnly}
                        onChange={readOnly ? undefined : (e) => handleCell(i, pid, e.target.value)}
                      />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default EditableTable
