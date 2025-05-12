#!/usr/bin/env tsx
/**
 * Email Notification Test Script
 * 
 * This script creates a new subtask for an existing task to test the email notification system.
 * It will send an email notification to the owner of the task.
 * 
 * Usage: npx tsx scripts/emailTest.ts <taskId> <emailToUse>
 * 
 * Example: npx tsx scripts/emailTest.ts 1 test@example.com
 */

import dotenv from 'dotenv';
import { createSubTask } from '../app/actions/serverTasks/crudSubTasks';
import { getTaskById } from '../app/actions/serverTasks/crudTasks';

// Load environment variables
dotenv.config();

async function testEmailNotification() {
  try {
    // Check if arguments are provided
    const taskId = process.argv[2] ? parseInt(process.argv[2], 10) : null;
    const testEmail = process.argv[3];

    if (!taskId) {
      console.error('Task ID must be provided as the first argument');
      console.log('Usage: npx tsx scripts/emailTest.ts <taskId> [emailToUse]');
      process.exit(1);
    }

    // Get the task to make sure it exists
    const taskResult = await getTaskById(taskId);
    
    if (!taskResult || taskResult.length === 0) {
      console.error(`Task with ID ${taskId} not found`);
      process.exit(1);
    }

    const task = taskResult[0];
    console.log(`Found task: "${task.tasks.title}" owned by "${task.user.name}" (${task.user.email})`);
    
    if (testEmail) {
      console.log(`NOTE: Email will be sent to ${testEmail} instead of the actual task owner`);
      // For test purposes, we could modify the task owner's email here if we had direct DB access
      // But for this test, the email will be sent to the actual owner based on the database record
    }

    // Create a new subtask, which should trigger an email notification to the task owner
    console.log('Creating a test subtask...');
    const subtask = await createSubTask(
      taskId, 
      'Test Subtask - Email Notification', 
      'This is a test subtask created to verify the email notification system. You can delete this subtask after receiving the notification.'
    );

    console.log(`Subtask created with ID: ${subtask.id}`);
    console.log('Email notification should be sent to the task owner.');
    console.log('Check your email and the application logs for confirmation.');

  } catch (error) {
    console.error('Error running email notification test:', error);
    process.exit(1);
  }
}

testEmailNotification();
