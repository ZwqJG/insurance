import React from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  rows?: number
  readOnly?: boolean
}

const EditableText: React.FC<Props> = ({ value, onChange, rows = 4, readOnly = false }) => (
  <textarea
    className="editable-textarea"
    value={value}
    rows={rows}
    readOnly={readOnly}
    onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
  />
)

export default EditableText
