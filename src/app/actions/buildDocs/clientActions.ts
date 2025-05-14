'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import * as crudActions from './crudActions';
import { buildDocs, buildDocSections, buildDocSectionTemplates } from '@/db/schema';

// Type for build doc
export type BuildDoc = typeof buildDocs.$inferSelect;

// Type for build doc section
export type BuildDocSection = typeof buildDocSections.$inferSelect;

// Type for build doc section template
export type BuildDocSectionTemplate = typeof buildDocSectionTemplates.$inferSelect;

// Hook to get all build docs for a server
export function useServerBuildDocs(serverId: number) {
  return useQuery({
    queryKey: ['buildDocs', serverId],
    queryFn: () => crudActions.getServerBuildDocs(serverId),
    enabled: !!serverId,
  });
}

// Hook to get a single build doc
export function useBuildDoc(buildDocId: number | undefined) {
  return useQuery({
    queryKey: ['buildDoc', buildDocId],
    queryFn: () => crudActions.getBuildDoc(buildDocId as number),
    enabled: !!buildDocId,
  });
}

// Hook to get all sections for a build doc
export function useBuildDocSections(buildDocId: number | undefined) {
  return useQuery({
    queryKey: ['buildDocSections', buildDocId],
    queryFn: () => crudActions.getBuildDocSections(buildDocId as number),
    enabled: !!buildDocId,
  });
}

// Hook to get all section templates
export function useBuildDocSectionTemplates() {
  return useQuery({
    queryKey: ['buildDocSectionTemplates'],
    queryFn: () => crudActions.getBuildDocSectionTemplates(),
  });
}

// Hook to create a new build doc
export function useCreateBuildDoc() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (data: { 
      serverId: number; 
      title: string; 
      description?: string;
      userId: string;
    }) => {
      return crudActions.createBuildDoc(data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buildDocs', variables.serverId] });
      message.success('Build doc created successfully');
    },
    onError: () => {
      message.error('Failed to create build doc');
    },
  });
}

// Hook to update a build doc
export function useUpdateBuildDoc() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (data: { 
      id: number; 
      title?: string; 
      description?: string;
      userId: string;
    }) => {
      return crudActions.updateBuildDoc(data);
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({ queryKey: ['buildDoc', data.data.id] });
        queryClient.invalidateQueries({ queryKey: ['buildDocs', data.data.serverId] });
        message.success('Build doc updated successfully');
      }
    },
    onError: () => {
      message.error('Failed to update build doc');
    },
  });
}

// Hook to delete a build doc
export function useDeleteBuildDoc() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async ({ id, serverId }: { id: number; serverId: number }) => {
      return crudActions.deleteBuildDoc(id, serverId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buildDocs', variables.serverId] });
      message.success('Build doc deleted successfully');
    },
    onError: () => {
      message.error('Failed to delete build doc');
    },
  });
}

// Hook to create a new section
export function useCreateBuildDocSection() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (data: { 
      buildDocId: number; 
      parentSectionId?: number; 
      title: string; 
      content?: string; 
      order?: number;
      userId: string;
    }) => {
      return crudActions.createBuildDocSection(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buildDocSections', variables.buildDocId] });
      message.success('Section created successfully');
    },
    onError: () => {
      message.error('Failed to create section');
    },
  });
}

// Hook to update a section
export function useUpdateBuildDocSection() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (data: { 
      id: number; 
      buildDocId: number; // Used for cache invalidation after update
      title?: string; 
      content?: string; 
      order?: number;
      parentSectionId?: number | null; // Added to support reparenting
      userId: string;
    }) => {
      // We don't pass buildDocId to the server action as it's already associated with the section
      return crudActions.updateBuildDocSection({
        id: data.id,
        title: data.title,
        content: data.content,
        order: data.order,
        parentSectionId: data.parentSectionId,
        userId: data.userId
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buildDocSections', variables.buildDocId] });
      message.success('Section updated successfully');
    },
    onError: () => {
      message.error('Failed to update section');
    },
  });
}

// Hook to delete a section
export function useDeleteBuildDocSection() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async ({ id }: { id: number; buildDocId: number }) => {
      return crudActions.deleteBuildDocSection(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buildDocSections', variables.buildDocId] });
      message.success('Section deleted successfully');
    },
    onError: () => {
      message.error('Failed to delete section');
    },
  });
}

// Hook to create a section from a template
export function useCreateSectionFromTemplate() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (data: { 
      buildDocId: number; 
      parentSectionId?: number; 
      templateId: number; 
      userId: string;
    }) => {
      return crudActions.createSectionFromTemplate(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buildDocSections', variables.buildDocId] });
      message.success('Section created from template successfully');
    },
    onError: () => {
      message.error('Failed to create section from template');
    },
  });
}

// Hook to create a new template
export function useCreateBuildDocSectionTemplate() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (data: { 
      title: string; 
      content?: string; 
      tags?: string[];
      isPublic?: boolean;
      userId: string;
    }) => {
      return crudActions.createBuildDocSectionTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildDocSectionTemplates'] });
      message.success('Template created successfully');
    },
    onError: () => {
      message.error('Failed to create template');
    },
  });
}
