import apiClient from './client';

export interface ExportOptions {
  type: 'part' | 'team' | 'summary';
  partId?: string;
  teamId?: string;
  summaryId?: string;
  week: string;
}

export const exportApi = {
  downloadExcel: async (options: ExportOptions): Promise<void> => {
    const response = await apiClient.get('/export/excel', {
      params: options,
      responseType: 'blob',
    });

    const blob = new Blob([response.data as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const disposition = response.headers['content-disposition'] as string | undefined;
    let filename = `${options.type}_${options.week}.xlsx`;
    if (disposition) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?(.+)/i);
      if (match) {
        filename = decodeURIComponent(match[1].replace(/"/g, ''));
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
