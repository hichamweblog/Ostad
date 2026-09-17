import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ExportToDocOptions {
  landscape?: boolean;
  title?: string;
}

export function exportToDoc(htmlContent: string, filename: string, options?: ExportToDocOptions) {
  const isLandscape = options?.landscape ?? false;
  const docTitle = options?.title || filename;

  const landscapeCss = isLandscape
    ? `
      @page Section1 {
        size: 841.9pt 595.3pt;
        mso-page-orientation: landscape;
        margin: 1.0cm 1.0cm 1.0cm 1.0cm;
        mso-header-margin: 0.5cm;
        mso-footer-margin: 0.5cm;
      }
      div.Section1 { page: Section1; }
    `
    : `
      @page Section1 {
        size: 595.3pt 841.9pt;
        margin: 1.2cm 1.0cm 1.2cm 1.0cm;
        mso-header-margin: 0.5cm;
        mso-footer-margin: 0.5cm;
      }
      div.Section1 { page: Section1; }
    `;

  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
    <head>
      <meta charset='utf-8'>
      <title>${docTitle}</title>
      <style>
        ${landscapeCss}
        body { font-family: 'Amiri', 'Traditional Arabic', 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; }
        table { border-collapse: collapse; width: 100%; direction: rtl; }
        td, th { border: 1px solid #cbd5e1; padding: 6px; }
      </style>
    </head><body dir="rtl"><div class="Section1">
  `;
  const footer = "</div></body></html>";
  const sourceHTML = header + htmlContent + footer;

  const blob = new Blob(['\ufeff' + sourceHTML], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = url;
  fileDownload.download = filename + '.doc';
  fileDownload.click();
  document.body.removeChild(fileDownload);
  URL.revokeObjectURL(url);
}
