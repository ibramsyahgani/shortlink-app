'use client';

import { useState, useRef, useEffect } from 'react';
import { SOPRow, FilterState } from './types';
import FileModal from './FileModal';

interface SopTableProps {
  rows: SOPRow[];
  onRowsChange: (rows: SOPRow[]) => void;
}

const COLUMNS = [
  { key: 'no', label: 'No', width: 'w-12' },
  { key: 'kategori', label: 'Kategori', width: 'w-36' },
  { key: 'pic', label: 'PIC', width: 'w-36' },
  { key: 'product', label: 'Product', width: 'w-36' },
  { key: 'topik', label: 'Topik', width: 'w-40' },
  { key: 'subTopik', label: 'Sub Topik', width: 'w-40' },
  { key: 'sopDokumen', label: 'SOP Dokumen', width: 'w-48' },
  { key: 'lampiran', label: 'Lampiran', width: 'w-32' },
  { key: 'actions', label: '', width: 'w-16' },
] as const;

type ColumnKey = 'kategori' | 'pic' | 'product' | 'topik' | 'subTopik' | 'sopDokumen';
const FILTER_COLS: ColumnKey[] = ['kategori', 'pic', 'product', 'topik', 'subTopik', 'sopDokumen'];

function getUnique(rows: SOPRow[], key: ColumnKey): string[] {
  return Array.from(new Set(rows.map(r => r[key]).filter(Boolean))).sort();
}

interface DropdownFilterProps {
  label: string;
  values: string[];
  active: string;
  onChange: (v: string) => void;
}

function DropdownFilter({ label, values, active, onChange }: DropdownFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
          active ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {label}
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        {active && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-40 max-h-56 overflow-y-auto">
          <button
            onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${!active ? 'font-semibold text-blue-600' : 'text-gray-500'}`}
          >
            Semua
          </button>
          {values.map(v => (
            <button
              key={v}
              onClick={() => { onChange(v); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${active === v ? 'font-semibold text-blue-600 bg-blue-50' : 'text-gray-700'}`}
            >
              {v}
            </button>
          ))}
          {values.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400 italic">Tidak ada opsi</div>
          )}
        </div>
      )}
    </div>
  );
}

interface EditableCellProps {
  value: string;
  rowId: string;
  field: ColumnKey;
  suggestions: string[];
  onSave: (rowId: string, field: ColumnKey, value: string) => void;
}

function EditableCell({ value, rowId, field, suggestions, onSave }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [showSugg, setShowSugg] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = suggestions.filter(s => s.toLowerCase().includes(draft.toLowerCase()) && s !== draft);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    onSave(rowId, field, draft);
    setEditing(false);
    setShowSugg(false);
  };

  if (!editing) {
    return (
      <div
        onClick={() => { setDraft(value); setEditing(true); }}
        className="min-h-[28px] cursor-text hover:bg-blue-50 rounded px-2 py-1 text-sm text-gray-800 group-hover:ring-1 group-hover:ring-blue-100 transition-all"
      >
        {value || <span className="text-gray-300 italic text-xs">Klik untuk edit</span>}
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={draft}
        onChange={e => { setDraft(e.target.value); setShowSugg(true); }}
        onBlur={() => { setTimeout(commit, 150); }}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(value); } }}
        className="w-full border border-blue-400 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-200"
      />
      {showSugg && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded shadow-lg z-20 max-h-40 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s}
              onMouseDown={() => { setDraft(s); setShowSugg(false); onSave(rowId, field, s); setEditing(false); }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SopTable({ rows, onRowsChange }: SopTableProps) {
  const [filters, setFilters] = useState<FilterState>({
    kategori: '', pic: '', product: '', topik: '', subTopik: '', sopDokumen: '',
  });
  const [fileModal, setFileModal] = useState<{ rowId: string; sopName: string } | null>(null);

  const updateCell = (rowId: string, field: ColumnKey, value: string) => {
    onRowsChange(rows.map(r => r.id === rowId ? { ...r, [field]: value } : r));
  };

  const deleteRow = (rowId: string) => {
    if (confirm('Hapus SOP ini?')) onRowsChange(rows.filter(r => r.id !== rowId));
  };

  const updateFiles = (rowId: string, files: SOPRow['lampiran']) => {
    onRowsChange(rows.map(r => r.id === rowId ? { ...r, lampiran: files } : r));
  };

  const filtered = rows.filter(row =>
    FILTER_COLS.every(col => !filters[col] || row[col] === filters[col])
  );

  const activeFileRow = fileModal ? rows.find(r => r.id === fileModal.rowId) : null;

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Filter bar */}
      {Object.values(filters).some(Boolean) && (
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <span className="text-xs text-blue-600 font-medium">Filter aktif:</span>
          {FILTER_COLS.filter(col => filters[col]).map(col => (
            <span key={col} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              {filters[col]}
              <button onClick={() => setFilters(f => ({ ...f, [col]: '' }))} className="hover:text-blue-900">✕</button>
            </span>
          ))}
          <button
            onClick={() => setFilters({ kategori: '', pic: '', product: '', topik: '', subTopik: '', sopDokumen: '' })}
            className="text-xs text-blue-500 hover:text-blue-700 ml-auto"
          >
            Reset semua
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="w-12 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">No</th>
              {FILTER_COLS.map(col => (
                <th key={col} className="px-3 py-3 text-left">
                  <DropdownFilter
                    label={COLUMNS.find(c => c.key === col)?.label || col}
                    values={getUnique(rows, col)}
                    active={filters[col]}
                    onChange={v => setFilters(f => ({ ...f, [col]: v }))}
                  />
                </th>
              ))}
              <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Lampiran</th>
              <th className="w-16 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-sm">Belum ada data SOP</p>
                  <p className="text-xs mt-1">Klik "Tambah SOP" untuk menambahkan entri baru</p>
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 group transition-colors">
                  <td className="px-3 py-2 text-sm text-gray-400 font-mono">{idx + 1}</td>
                  {FILTER_COLS.map(col => (
                    <td key={col} className="px-1 py-1">
                      <EditableCell
                        value={row[col]}
                        rowId={row.id}
                        field={col}
                        suggestions={getUnique(rows, col)}
                        onSave={updateCell}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setFileModal({ rowId: row.id, sopName: row.sopDokumen })}
                      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <span>📎</span>
                      <span>{row.lampiran.length > 0 ? `${row.lampiran.length} file` : 'Upload'}</span>
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all text-lg leading-none"
                      title="Hapus baris"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="px-6 py-3 border-t border-gray-100 bg-white flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Menampilkan {filtered.length} dari {rows.length} SOP
        </span>
        <span className="text-xs text-gray-400">
          Klik sel untuk mengedit • Klik header untuk filter
        </span>
      </div>

      {/* File Modal */}
      {fileModal && activeFileRow && (
        <FileModal
          rowId={fileModal.rowId}
          files={activeFileRow.lampiran}
          sopName={fileModal.sopName}
          onClose={() => setFileModal(null)}
          onFilesChange={updateFiles}
        />
      )}
    </div>
  );
}
