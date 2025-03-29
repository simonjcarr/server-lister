-- Insert default chat categories
INSERT INTO chat_categories (name, icon, enabled, created_at, updated_at) 
VALUES ('General', 'message-square', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO chat_categories (name, icon, enabled, created_at, updated_at) 
VALUES ('Issues', 'alert-triangle', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO chat_categories (name, icon, enabled, created_at, updated_at) 
VALUES ('Updates', 'refresh-cw', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO chat_categories (name, icon, enabled, created_at, updated_at) 
VALUES ('Questions', 'help-circle', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO chat_categories (name, icon, enabled, created_at, updated_at) 
VALUES ('Announcements', 'megaphone', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
