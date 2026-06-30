export interface SOPRow {
  id: string;
  kategori: string;
  pic: string;
  product: string;
  topik: string;
  subTopik: string;
  sopDokumen: string;
  lampiran: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  // r2-backed file has fileId for server delete
  fileId?: string;
}

export interface FilterState {
  kategori: string;
  pic: string;
  product: string;
  topik: string;
  subTopik: string;
  sopDokumen: string;
}
