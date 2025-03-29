'use server';

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { auth } from "@/auth";

// Diagnostic function to check the database schema
export async function checkUsersServersTable() {
  try {
    // Check table schema
    const tableInfo = await db.execute(sql`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users_servers'
    `);
    
    // Get constraints
    const constraints = await db.execute(sql`
      SELECT con.conname AS constraint_name,
             con.contype AS constraint_type,
             pg_get_constraintdef(con.oid) AS constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'users_servers'
    `);
    
    // Get indexes
    const indexes = await db.execute(sql`
      SELECT
        i.relname AS index_name,
        a.attname AS column_name,
        ix.indisunique AS is_unique
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname = 'users_servers'
      ORDER BY
        t.relname,
        i.relname;
    `);
    
    return {
      tableInfo: tableInfo.rows,
      constraints: constraints.rows,
      indexes: indexes.rows
    };
  } catch (error) {
    console.error("Error checking users_servers table:", error);
    return {
      error: "Failed to check users_servers table"
    };
  }
}

// Diagnostic function to check a user's favorites
export async function checkUserFavorites() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "No user authenticated" };
    }
    
    const userId = session.user.id;
    
    // Get raw favorites data
    const favorites = await db.execute(sql`
      SELECT * FROM users_servers WHERE "userId" = ${userId}
    `);
    
    return {
      userId,
      favorites: favorites.rows
    };
  } catch (error) {
    console.error("Error checking user favorites:", error);
    return {
      error: "Failed to check user favorites"
    };
  }
}

// Function to manually add a favorite directly
export async function manualAddFavorite(serverId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "No user authenticated" };
    }
    
    const userId = session.user.id;
    const now = new Date().toISOString();
    
    // Direct SQL insert
    await db.execute(sql`
      INSERT INTO users_servers ("userId", "serverId", "created_at", "updated_at")
      VALUES (${userId}, ${serverId}, ${now}, ${now})
      ON CONFLICT ("userId", "serverId") DO NOTHING
    `);
    
    return { success: true, message: "Favorite added manually" };
  } catch (error) {
    console.error("Error manually adding favorite:", error);
    return {
      error: "Failed to manually add favorite",
      details: error
    };
  }
}
