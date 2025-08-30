'use client';

import { useState } from 'react';
import apiFetch from '../../lib/api';
import { ImportResultSchema } from '@packages/types';
import { z } from 'zod';

interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

function parseCsv(text: string): ParsedCsv {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift()?.split(',') || [];
  const rows = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const values = line.split(',');
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] ? values[i].trim() : '';
      });
      return obj;
    });
  return { headers, rows };
}

export default function ImportPage() {
  const [preview, setPreview] = useState<ParsedCsv | null>(null);
  const [result, setResult] = useState<z.infer<typeof ImportResultSchema> | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsv(text);
    setPreview(parsed);
    setResult(null);
    setReportUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!preview) return;
    const res = await apiFetch('/import/spreadsheet/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: preview.rows })
    });
    const json = await res.json();
    const data = ImportResultSchema.parse(json);
    setResult(data);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    setReportUrl(URL.createObjectURL(blob));
  }

  return (
    <div>
      <h1>Import Members</h1>
      <p>전화번호는 하이픈 없이 숫자만 입력해 주세요.</p>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".csv" onChange={handleFile} />
        <button type="submit" disabled={!preview}>
          업로드
        </button>
      </form>
      {preview && (
        <div>
          <h2>Preview</h2>
          <table border={1} cellPadding={4}>
            <thead>
              <tr>
                {preview.headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.slice(0, 5).map((row, i) => (
                <tr key={i}>
                  {preview.headers.map((h) => (
                    <td key={h}>{row[h]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result && (
        <div>
          <h2>Result</h2>
          <ul>
            <li>Members created: {result.created.members}</li>
            <li>Members updated: {result.updated.members}</li>
            <li>MemberTerms created: {result.memberTerms.created}</li>
            <li>MemberTerms updated: {result.memberTerms.updated}</li>
            <li>Sections created: {result.sections.created}</li>
            <li>Errors: {result.errors.length}</li>
          </ul>
          {result.errors.length > 0 && (
            <ul>
              {result.errors.map((e, i) => (
                <li key={i}>
                  Row {e.row}: {e.reason}
                </li>
              ))}
            </ul>
          )}
          {reportUrl && (
            <a href={reportUrl} download="import-report.json">
              Download report
            </a>
          )}
        </div>
      )}
    </div>
  );
}

