/** Client-side CV file reading. Everything happens in the visitor's browser:
 *  the file is never uploaded or stored anywhere, so there is nothing to
 *  delete. Only the extracted text is returned (and only saved when the user
 *  saves their profile).
 *
 *  Supported: .txt/.md, PDFs (text layer; OCR fallback for scanned PDFs),
 *  and photos/screenshots of CVs (OCR). All libraries load lazily so they
 *  cost nothing until a file is actually chosen. */

export type CVReadProgress = (message: string) => void;

const OCR_PAGE_LIMIT = 3;

export async function readCVFile(file: File, progress: CVReadProgress): Promise<string> {
  const name = file.name.toLowerCase();

  if (file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return file.text();
  }

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    progress("Reading PDF...");
    const text = await pdfText(file, progress);
    if (text.replace(/\s/g, "").length >= 120) return text;
    // Scanned PDF: no real text layer - fall back to OCR on rendered pages.
    progress("No selectable text found - running OCR...");
    return ocrPdf(file, progress);
  }

  if (file.type.startsWith("image/")) {
    progress("Running OCR on the image...");
    return ocrImage(file, progress);
  }

  throw new Error("Unsupported file type - use a PDF, an image, or a .txt file.");
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  return pdfjs;
}

async function pdfText(file: File, progress: CVReadProgress): Promise<string> {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const doc = await task.promise;
  let out = "";
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      progress(`Reading PDF page ${i}/${doc.numPages}...`);
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      for (const item of content.items) {
        if ("str" in item) out += item.str + (item.hasEOL ? "\n" : " ");
      }
      out += "\n";
    }
  } finally {
    await task.destroy();
  }
  return out;
}

type TesseractLogMessage = { status: string; progress: number };

async function loadTesseract() {
  return (await import("tesseract.js")).default;
}

function ocrLogger(progress: CVReadProgress, label: string) {
  return (m: TesseractLogMessage) => {
    if (m.status === "recognizing text") progress(`${label} ${Math.round(m.progress * 100)}%...`);
  };
}

async function ocrImage(file: File, progress: CVReadProgress): Promise<string> {
  const Tesseract = await loadTesseract();
  const { data } = await Tesseract.recognize(file, "eng", {
    logger: ocrLogger(progress, "OCR"),
  });
  return data.text;
}

async function ocrPdf(file: File, progress: CVReadProgress): Promise<string> {
  const pdfjs = await loadPdfjs();
  const Tesseract = await loadTesseract();
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const doc = await task.promise;
  let out = "";
  try {
    const pages = Math.min(doc.numPages, OCR_PAGE_LIMIT);
    for (let i = 1; i <= pages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable for OCR.");
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const { data } = await Tesseract.recognize(canvas, "eng", {
        logger: ocrLogger(progress, `OCR page ${i}/${pages}`),
      });
      out += data.text + "\n";
    }
    if (doc.numPages > pages) out += `\n[OCR limited to first ${pages} pages]\n`;
  } finally {
    await task.destroy();
  }
  return out;
}
