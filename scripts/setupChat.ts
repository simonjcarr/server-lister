import { seedChatCategories } from './chat/seedCategories';
import { seedSampleMessages } from './chat/seedSampleMessages';

async function setupChat() {
  console.log('Setting up chat system...');
  
  // Step 1: Seed default chat categories
  await seedChatCategories();
  
  // Step 2: Seed sample chat messages
  await seedSampleMessages();
  
  console.log('Chat system setup complete!');
}

// Run the script if this is the main module
if (require.main === module) {
  setupChat()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error setting up chat system:', error);
      process.exit(1);
    });
}
