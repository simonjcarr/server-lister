// This script seeds default chat categories into the database
import { db } from '../../src/db';
import { chatCategories } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_CATEGORIES = [
  { name: "General", icon: "message-square" },
  { name: "Issues", icon: "alert-triangle" },
  { name: "Updates", icon: "refresh-cw" },
  { name: "Questions", icon: "help-circle" },
  { name: "Announcements", icon: "megaphone" },
];

export async function seedChatCategories() {
  console.log("Seeding chat categories...");
  
  for (const category of DEFAULT_CATEGORIES) {
    // Check if category already exists
    const existing = await db.select()
      .from(chatCategories)
      .where(eq(chatCategories.name, category.name))
      .limit(1);
    
    if (existing.length === 0) {
      const now = new Date();
      await db.insert(chatCategories).values({
        name: category.name,
        icon: category.icon,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created category: ${category.name}`);
    } else {
      console.log(`Category ${category.name} already exists.`);
    }
  }
  
  console.log("Chat categories seeding complete!");
}

// This will be executed by Next.js when using "next run"
seedChatCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding chat categories:", error);
    process.exit(1);
  });
