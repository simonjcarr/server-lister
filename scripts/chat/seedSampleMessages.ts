import { db } from "@/db";
import { chatMessages, chatCategories, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function seedSampleMessages() {
  console.log("Seeding sample chat messages...");
  
  // Get available categories
  const categories = await db
    .select()
    .from(chatCategories);
  
  if (categories.length === 0) {
    console.log("No categories found. Please run seedCategories.ts first.");
    return;
  }
  
  // Get the first user to use as author
  const firstUser = await db
    .select()
    .from(users)
    .limit(1);
  
  if (firstUser.length === 0) {
    console.log("No users found in the database.");
    return;
  }
  
  const userId = firstUser[0].id;
  
  // Sample server IDs (you might want to query actual servers from your database)
  const serverIds = [1, 2, 3]; 
  
  // Sample messages for each category
  const sampleMessages = {
    "General": [
      "Hello everyone! Just checking in.",
      "Has anyone updated the documentation yet?",
      "Server is running smoothly after the latest updates.",
      "What's the status on the network migration?",
      "Good morning team!",
    ],
    "Issues": [
      "I'm seeing high CPU usage on this server.",
      "There appears to be a memory leak in the application.",
      "Database connections are timing out occasionally.",
      "The backup job failed last night, investigating the cause.",
      "Network latency has increased in the last hour.",
    ],
    "Updates": [
      "Deployed the latest patch version: 2.4.3",
      "Updated the OS to the latest security patch.",
      "Rolled out new monitoring agents.",
      "Database has been upgraded to version 14.2",
      "New firewall rules have been implemented.",
    ],
    "Questions": [
      "What's the recommended setup for Redis on this machine?",
      "How do I configure the backup schedule?",
      "Where can I find the logs for the application?",
      "What's the process for requesting more storage?",
      "Who's responsible for managing the certificates?",
    ],
    "Announcements": [
      "Planned maintenance scheduled for this Sunday at 2 AM.",
      "New team member joining next week who will help manage this server.",
      "We're migrating to a new data center next month.",
      "Security audit will be conducted next Tuesday.",
      "New deployment pipeline has been set up for this server.",
    ],
  };
  
  // Create messages for each server and category
  const now = new Date();
  let count = 0;
  
  for (const serverId of serverIds) {
    const chatRoomId = `server:${serverId}`;
    
    for (const category of categories) {
      const categoryName = category.name;
      const messages = sampleMessages[categoryName as keyof typeof sampleMessages] || [];
      
      if (messages.length > 0) {
        for (const message of messages) {
          // Create a timestamp between 1 and 14 days ago
          const daysAgo = Math.floor(Math.random() * 14) + 1;
          const timestamp = new Date(now);
          timestamp.setDate(timestamp.getDate() - daysAgo);
          
          await db.insert(chatMessages).values({
            userId,
            message,
            chatRoomId,
            categoryId: category.id,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
          
          count++;
        }
      }
    }
  }
  
  console.log(`Created ${count} sample chat messages.`);
}

// Run the function if this file is executed directly
if (require.main === module) {
  seedSampleMessages()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error seeding sample chat messages:", error);
      process.exit(1);
    });
}
