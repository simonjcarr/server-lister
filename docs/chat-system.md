# Chat System Documentation

This document provides an overview of the chat system implementation and how to use it.

## Overview

The chat system provides real-time communication capabilities for server management. Each server has its own chat room, and messages are organized into categories (similar to Discord channels).

Key features:
- Real-time messaging using Server-Sent Events (SSE)
- Category-based organization (General, Issues, Updates, etc.)
- Notifications for users who have favorited servers or subscribed to collections
- Lazy loading of messages with pagination

## Setup

To set up the chat system, follow these steps:

1. **Run the setup script**:
   ```bash
   node scripts/setup-chat.js
   ```
   
   This script will:
   - Ensure the database tables exist
   - Seed default chat categories
   - Create sample messages for testing

2. **Restart your development server**:
   ```bash
   npm run dev
   ```

## Architecture

### Database Schema

The chat system uses two main tables:

- **chat_categories**: Defines the available chat categories (General, Issues, etc.)
- **chat_messages**: Stores all chat messages with references to categories and servers

### API Endpoints

- **POST /api/chat**: Send a new chat message
- **GET /api/chat**: Connect to SSE stream for real-time updates
- **GET /api/chat/messages**: Fetch paginated chat messages

### Component Structure

- **ChatPanel**: Main component for the chat interface
- **ChatContext**: Manages chat state and message handling
- **NotificationContext**: Manages notification display for new messages

## Usage

The chat panel is automatically displayed on the right side of the server details view. Users can:

1. Select a category to view messages
2. Scroll up to load more messages
3. Send new messages using the input field
4. Receive notifications when messages are sent to favorite servers

## Customization

To add new chat categories, modify the `DEFAULT_CATEGORIES` array in `scripts/chat/seed-categories.js` and run the setup script again.

## Troubleshooting

If you encounter issues:

1. Check the browser console for errors
2. Verify database connection settings
3. Ensure notifications are allowed in your browser
4. Check server logs for API request errors

## Future Enhancements

Potential improvements for future versions:
- Message editing and deletion
- File attachments
- @mentions and notifications
- Emoji reactions
- Read receipts
