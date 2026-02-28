import { NextRequest, NextResponse } from 'next/server';
import { getQuestions, appendQuestion, appendQuestionsBatch, deleteQuestion } from '@/lib/sheets';
import { isAdminAuthenticated } from '@/lib/auth';

// GET /api/questions — public, used by quiz page
export async function GET() {
  try {
    const questions = await getQuestions();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST /api/questions — admin only
export async function POST(request: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Support single object or an array of objects
    if (body.questions && Array.isArray(body.questions)) {
      if (body.questions.length === 0) return NextResponse.json({ success: true });
      await appendQuestionsBatch(body.questions);
      return NextResponse.json({ success: true, count: body.questions.length });
    }

    const { question, optionA, optionB, optionC, optionD, correctAnswer } = body;

    if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      return NextResponse.json({ error: 'correctAnswer must be A, B, C, or D' }, { status: 400 });
    }

    await appendQuestion({ question, optionA, optionB, optionC, optionD, correctAnswer });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to append question(s):', error);
    return NextResponse.json({ error: 'Failed to add question(s)' }, { status: 500 });
  }
}

// DELETE /api/questions?id=... — admin only
export async function DELETE(request: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    await deleteQuestion(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
