import { google, sheets_v4 } from 'googleapis';

let sheetsClient: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

// ─── Questions ──────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export async function getQuestions(): Promise<Question[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Questions!A2:H',
  });
  const rows = res.data.values ?? [];
  return rows.map((row, i) => ({
    id: row[0] ?? String(i + 1),
    question: row[1] ?? '',
    optionA: row[2] ?? '',
    optionB: row[3] ?? '',
    optionC: row[4] ?? '',
    optionD: row[5] ?? '',
    correctAnswer: (row[6] ?? 'A') as Question['correctAnswer'],
  }));
}

export async function appendQuestion(q: Omit<Question, 'id'>): Promise<void> {
  const sheets = getSheetsClient();
  const id = Date.now().toString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Questions!A:H',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[id, q.question, q.optionA, q.optionB, q.optionC, q.optionD, q.correctAnswer]],
    },
  });
}

export async function appendQuestionsBatch(questions: Omit<Question, 'id'>[]): Promise<void> {
  const sheets = getSheetsClient();
  const values = questions.map((q, i) => [
    (Date.now() + i).toString(), // unique IDs
    q.question, q.optionA, q.optionB, q.optionC, q.optionD, q.correctAnswer
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Questions!A:H',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  const sheets = getSheetsClient();
  // Find the row with matching ID
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Questions!A2:A',
  });
  const rows = res.data.values ?? [];
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) return;

  // Get sheet ID for Questions sheet
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === 'Questions');
  const sheetId = sheet?.properties?.sheetId ?? 0;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex + 1, // +1 for header row
            endIndex: rowIndex + 2,
          },
        },
      }],
    },
  });
}

// ─── Responses ───────────────────────────────────────────────────────────────

export interface QuizResponse {
  timestamp: string;
  name: string;
  registerNo: string;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  answers: string; // JSON string
}

export async function appendResponse(r: Omit<QuizResponse, 'timestamp'>): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Responses!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        new Date().toISOString(),
        r.name,
        r.registerNo,
        r.totalScore,
        r.correctCount,
        r.totalQuestions,
        r.answers,
      ]],
    },
  });
}

export async function getResponses(): Promise<QuizResponse[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Responses!A2:G',
  });
  const rows = res.data.values ?? [];
  return rows.map((row) => ({
    timestamp: row[0] ?? '',
    name: row[1] ?? '',
    registerNo: row[2] ?? '',
    totalScore: Number(row[3]) || 0,
    correctCount: Number(row[4]) || 0,
    totalQuestions: Number(row[5]) || 0,
    answers: row[6] ?? '[]',
  }));
}

// ─── Sheet Bootstrap ─────────────────────────────────────────────────────────
// Call this once to ensure headers exist in both sheets.
export async function bootstrapSheets(): Promise<void> {
  const sheets = getSheetsClient();

  // Ensure Questions header row
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Questions!A1:G1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['ID', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer']] },
  });

  // Ensure Responses header row
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Responses!A1:G1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['Timestamp', 'Name', 'Register No', 'Total Score', 'Correct Count', 'Total Questions', 'Answers JSON']] },
  });
}
