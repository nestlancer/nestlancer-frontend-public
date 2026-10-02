import { extractDocumentUrl, getApiErrorMessage } from '@nestlancer/api-client';
import { toast } from '@nestlancer/ui';
import { openSafeHttpUrl } from '@nestlancer/utils';

import { apiServices } from '@/lib/axios';

/** Fetch a fresh signed URL and open the latest project export zip. */
export async function openProjectExportDownload(projectId: string): Promise<boolean> {
  try {
    const raw = await apiServices.admin.downloadProjectExport(projectId);
    const url = extractDocumentUrl(raw);
    if (!url) {
      toast.error('Export file is not available yet.');
      return false;
    }
    if (!openSafeHttpUrl(url)) {
      toast.error('Could not download export');
      return false;
    }
    return true;
  } catch (e) {
    toast.error(getApiErrorMessage(e, 'Could not download export'));
    return false;
  }
}
