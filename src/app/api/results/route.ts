import { NextResponse } from 'next/server';
import { getResponses } from '@/lib/sheets';
import { isAdminAuthenticated } from '@/lib/auth';

// GET /api/results — admin only
export async function GET() {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const responses = await getResponses();
    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Failed to fetch responses:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
