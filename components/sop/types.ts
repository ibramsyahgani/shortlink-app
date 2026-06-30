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
}

export interface FilterState {
  kategori: string;
  pic: string;
  product: string;
  topik: string;
  subTopik: string;
  sopDokumen: string;
}

export interface SidebarCategory {
  id: string;
  label: string;
  icon: string;
  count: number;
}
