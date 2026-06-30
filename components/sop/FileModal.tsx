'use client';

import { useState, useRef } from 'react';
import { FileAttachment } from './types';
import { uploadSopFile, deleteSopFile, getSopFileUrl, SopFile } from '@/lib/api';

interface FileModalProps {
  rowId: string;
  files: FileAttachment[];
  sopName: string;
  onClose: () => void;
  onFilesChange: (rowId: string, files: FileAttachment[]) => void;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('sheet') || type.includes('excel')) return '📊';
  if (type.includes('image')) return '🖼️';
  if (type.includes('zip') || type.includes('rar')) return '🗜️';
  return '📎';
}

function toAttachment(f: SopFile): FileAttachment {
  return {
    id: f.id,
    fileId: f.id,
    name: f.file_name,
    url: getSopFileUrl(f.id),
    size: f.file_size,
    type: f.file_type,
    uploadedAt: f.uploaded_at,
  };
}

export default function FileModal({ rowId, files, sopName, onClose, onFilesChange }: FileModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList) => {
    setUploading(true);
    setError('');
    try {
      const uploaded: FileAttachment[] = [];
      for (const file of Array.from(fileList)) {
        const result = await uploadSopFile(rowId, file);
        uploaded.push(toAttachment(result));
      }
      onFilesChange(rowId, [...files, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload gagal');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (file: FileAttachment) => {
    try {
      if (file.fileId) await deleteSopFile(file.fileId);
      onFilesChange(rowId, files.filter(f => f.id !== file.id));
    } catch {
      setError('Gagal menghapus file');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">Lampiran File</h2>
            <p className="text-xs text-gray-500 mt-0.5">{sopName || 'SOP Dokumen'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Drop Zone */}
        <div className="p-5 border-b border-gray-100">
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-blue-400 bg-blue-50' : uploading ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            {uploading ? (
              <>
                <div className="text-3xl mb-2 animate-pulse">⏳</div>
                <p className="text-sm font-medium text-gray-500">Mengupload...</p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">📤</div>
                <p className="text-sm font-medium text-gray-700">Drag & drop file di sini</p>
                <p className="text-xs text-gray-400 mt-1">atau klik untuk memilih file</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-5">
          {files.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📂</div>
              <p className="text-sm">Belum ada file yang dilampirkan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map(file => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 group">
                  <span className="text-2xl">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={file.url}
                      download={file.name}
                      className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50"
                    >
                      ⬇️
                    </a>
                    <button
                      onClick={() => handleDelete(file)}
                      className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">{files.length} file terlampir</span>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
