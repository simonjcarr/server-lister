'use client';

import { 
  addServerToUser as serverAddServerToUser,
  removeServerFromUser as serverRemoveServerFromUser,
  getUserFavoriteServersWithDetails as serverGetUserFavoriteServersWithDetails
} from './userServerActions';

import {
  checkUsersServersTable as serverCheckUsersServersTable,
  checkUserFavorites as serverCheckUserFavorites,
  manualAddFavorite as serverManualAddFavorite
} from './diagnostics';

// Client-side wrapper for addServerToUser
export async function addServerToUser(serverId: number, userId: string) {
  try {
    const result = await serverAddServerToUser(serverId, userId);
    return result;
  } catch (error) {
    console.error('[Client] Error adding server to user:', error);
    throw error;
  }
}

// Client-side wrapper for removeServerFromUser
export async function removeServerFromUser(serverId: number, userId: string) {
  try {
    const result = await serverRemoveServerFromUser(serverId, userId);
    return result;
  } catch (error) {
    console.error('[Client] Error removing server from user:', error);
    throw error;
  }
}

// Client-side wrappers for getUserFavoriteServersWithDetails
export async function getUserFavoriteServersWithDetails() {
  try {
    const result = await serverGetUserFavoriteServersWithDetails();
    return result;
  } catch (error) {
    console.error('[Client] Error getting user favorite servers:', error);
    return [];
  }
}

// Client-side wrapper for diagnostic functions
export async function checkUsersServersTable() {
  try {
    return await serverCheckUsersServersTable();
  } catch (error) {
    console.error('[Client] Error checking users_servers table:', error);
    throw error;
  }
}

export async function checkUserFavorites() {
  try {
    return await serverCheckUserFavorites();
  } catch (error) {
    console.error('[Client] Error checking user favorites:', error);
    throw error;
  }
}

export async function manualAddFavorite(serverId: number) {
  try {
    const result = await serverManualAddFavorite(serverId);
    return result;
  } catch (error) {
    console.error('[Client] Error manually adding favorite:', error);
    throw error;
  }
}
