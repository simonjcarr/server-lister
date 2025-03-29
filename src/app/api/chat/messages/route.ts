import { NextRequest, NextResponse } from 'next/server';
import { getChatMessages } from '@/app/actions/chat/chatActions';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const chatRoomId = searchParams.get('chatRoomId');
    const categoryId = searchParams.get('categoryId');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!chatRoomId || !categoryId) {
      return NextResponse.json({ error: 'chatRoomId and categoryId are required' }, { status: 400 });
    }

    // Parse parameters
    const parsedCategoryId = parseInt(categoryId, 10);
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    if (isNaN(parsedCategoryId)) {
      return NextResponse.json({ error: 'Invalid categoryId' }, { status: 400 });
    }

    // Get messages from the database
    const messages = await getChatMessages(
      chatRoomId,
      parsedCategoryId,
      parsedLimit,
      parsedOffset
    );

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
