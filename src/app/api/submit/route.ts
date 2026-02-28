import { NextRequest, NextResponse } from 'next/server';
import { appendResponse } from '@/lib/sheets';

// POST /api/submit — public, called after quiz completion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, registerNo, totalScore, correctCount, totalQuestions, answers } = body;

    if (!name || !registerNo) {
      return NextResponse.json({ error: 'name and registerNo are required' }, { status: 400 });
    }

    await appendResponse({
      name,
      registerNo,
      totalScore: Number(totalScore) || 0,
      correctCount: Number(correctCount) || 0,
      totalQuestions: Number(totalQuestions) || 0,
      answers: typeof answers === 'string' ? answers : JSON.stringify(answers),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to submit quiz response:', error);
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 });
  }
}
