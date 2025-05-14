'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Card, Typography, Skeleton, App, Tabs, Input, Modal, Form, Space, Divider, Dropdown, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, DownOutlined, FileAddOutlined, ExportOutlined, FolderAddOutlined, HolderOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Import syntax highlighting CSS
import 'highlight.js/styles/github-dark.css';

import {
  useBuildDoc,
  useBuildDocSections,
  useCreateBuildDocSection,
  useUpdateBuildDocSection,
  useUpdateSectionOrder,
  useDeleteBuildDocSection,
  useBuildDocSectionTemplates,
  useCreateSectionFromTemplate,
  useCreateBuildDocSectionTemplate,
  useCreateTemplateFromSection,
  BuildDocSection
} from '@/app/actions/buildDocs/clientActions';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

type TabKey = 'edit' | 'preview';

// Props interface for the viewer component
interface ServerBuildDocViewerProps {
  buildDocId: number;
  serverId: number; // Required to keep URL navigation structure consistent
}

// SortableItem component for each section
function SortableItem({ 
  id, 
  title, 
  children, 
  onSelect,
  onAddChild,
  isSelected,
  hasChildren,
  isExpanded,
  onToggleExpand
}: { 
  id: string; 
  title: string; 
  children?: React.ReactNode; 
  onSelect: (id: string) => void;
  onAddChild: (parentId: number) => void;
  isSelected: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand: (id: string, expanded: boolean) => void;
}) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
    isDragging
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    marginBottom: '4px',
    backgroundColor: isSelected ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
    borderRadius: '4px',
    padding: '4px 8px',
    paddingRight: '0px',
    border: isSelected ? '1px solid #1890ff' : '1px solid transparent',
    width: '100%',
    boxSizing: 'border-box' as const,
    overflow: 'visible' as const,
  };
  
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(id, !isExpanded);
  };
  
  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center w-full">
        <div className="flex items-center flex-grow mr-2">
          <div {...listeners} {...attributes} className="mr-2 cursor-grab">
            <HolderOutlined />
          </div>
          {hasChildren && (
            <div 
              className="mr-1 cursor-pointer text-gray-500 hover:text-gray-700" 
              onClick={toggleExpand}
            >
              {isExpanded ? <DownOutlined /> : <span style={{ display: 'inline-block', transform: 'rotate(-90deg)' }}>▼</span>}
            </div>
          )}
          <div className="truncate" onClick={() => onSelect(id)}>
            <span>{title}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Button 
            type="text" 
            size="small" 
            icon={<FolderAddOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(parseInt(id, 10));
            }}
            title="Add child section"
            style={{ marginRight: 0, padding: '0 8px' }}
          />
        </div>
      </div>
      {children && isExpanded && <div className="pl-6 mt-2 pr-[32px] -mr-[32px]">{children}</div>}
    </div>
  );
}

export default function ServerBuildDocViewer({ buildDocId }: ServerBuildDocViewerProps) {
  // serverId is passed in the props but not used directly in this component
  const { data: session } = useSession();
  const { message, modal } = App.useApp();
  
  // State
  const [selectedSectionId, setSelectedSectionId] = useState<number | undefined>(undefined);
  const [selectedSection, setSelectedSection] = useState<BuildDocSection | null>(null);
  const [sectionContent, setSectionContent] = useState('');
  const [activeTabKey, setActiveTabKey] = useState<TabKey>('edit');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [addModalType, setAddModalType] = useState<'new' | 'template'>('new');
  const [newSectionParentId, setNewSectionParentId] = useState<number | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [form] = Form.useForm();
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Queries
  const { data: buildDocData, isLoading: isLoadingDoc } = useBuildDoc(buildDocId);
  const { data: sectionsData, isLoading: isLoadingSections, refetch: refetchSections } = useBuildDocSections(buildDocId);
  const { data: templatesData } = useBuildDocSectionTemplates(true); // Get root templates only
  const { mutate: createTemplate, isPending: isCreatingTemplate } = useCreateBuildDocSectionTemplate();
  const { mutate: createTemplateFromSection, isPending: isCreatingTemplateFromSection } = useCreateTemplateFromSection();
  const { mutate: updateSectionOrder } = useUpdateSectionOrder();
  
  // Type guard for section data response
  type SectionResponse = { success: boolean; data: BuildDocSection[] };
  type TemplateResponse = { success: boolean; data: unknown[] };
  
  const isSectionResponse = useCallback((data: unknown): data is SectionResponse => {
    return data !== null && typeof data === 'object' && 'success' in (data as Record<string, unknown>) && 'data' in (data as Record<string, unknown>);
  }, []);
  
  const isTemplateResponse = useCallback((data: unknown): data is TemplateResponse => {
    return data !== null && typeof data === 'object' && 'success' in (data as Record<string, unknown>) && 'data' in (data as Record<string, unknown>);
  }, []);
  
  // Mutations
  const { mutate: createSection, isPending: isCreatingSection } = useCreateBuildDocSection();
  const { mutate: updateSection, isPending: isUpdatingSection } = useUpdateBuildDocSection();
  const { mutate: deleteSection, isPending: isDeletingSection } = useDeleteBuildDocSection();
  const { mutate: createFromTemplate, isPending: isCreatingFromTemplate } = useCreateSectionFromTemplate();
  
  const buildDoc = buildDocData?.success ? buildDocData.data : undefined;
  
  // Use memoization for sections and templates to stabilize useEffect dependencies
  const sections = useMemo(() => {
    return isSectionResponse(sectionsData) && sectionsData.success ? sectionsData.data : [];
  }, [sectionsData, isSectionResponse]);
  
  const templates = useMemo(() => {
    return isTemplateResponse(templatesData) && templatesData.success ? templatesData.data
      // Only include root templates in the dropdown
      .filter((template) => template.parentTemplateId === null) 
      : [];
  }, [templatesData, isTemplateResponse]);
  
  // Group sections by their parent for the draggable tree structure
  const getSectionsGroupedByParent = useCallback((sectionList: BuildDocSection[]) => {
    const result = new Map<number | null, BuildDocSection[]>();
    
    sectionList.forEach(section => {
      const parentId = section.parentSectionId;
      if (!result.has(parentId)) {
        result.set(parentId, []);
      }
      result.get(parentId)?.push(section);
    });
    
    // Sort each group by order
    result.forEach((sectionList) => {
      sectionList.sort((a, b) => a.order - b.order);
    });
    
    return result;
  }, []);
  
  // Function to handle toggling section expansion
  const handleToggleExpand = (sectionId: string, expanded: boolean) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: expanded
    }));
  };
  
  // Initialize expanded sections if needed
  useEffect(() => {
    // By default, set all sections to collapsed when first loaded
    if (sections.length > 0 && Object.keys(expandedSections).length === 0) {
      const initialExpandedState: Record<string, boolean> = {};
      sections.forEach(section => {
        initialExpandedState[section.id.toString()] = false;
      });
      setExpandedSections(initialExpandedState);
    }
  }, [sections, expandedSections]);
  
  // Function to render the sortable tree
  const SortableSectionTree = () => {
    
    const sectionsByParent = getSectionsGroupedByParent(sections);
    
    // Function to handle drag end and reordering
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      
      if (!over || active.id === over.id) {
        return;
      }
      
      // Find the affected sections
      const activeSection = sections.find(s => s.id.toString() === active.id);
      const overSection = sections.find(s => s.id.toString() === over.id);
      
      if (!activeSection || !overSection || !session?.user?.id) {
        return;
      }
      
      // If both sections have the same parent, just reorder
      if (activeSection.parentSectionId === overSection.parentSectionId) {
        const parentId = activeSection.parentSectionId;
        const sectionsWithSameParent = [...(sectionsByParent.get(parentId) || [])];
        
        const oldIndex = sectionsWithSameParent.findIndex(s => s.id === activeSection.id);
        const newIndex = sectionsWithSameParent.findIndex(s => s.id === overSection.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          // Reorder the array
          const newSectionsOrder = arrayMove(sectionsWithSameParent, oldIndex, newIndex);
          
          // Update orders in database
          newSectionsOrder.forEach((section, index) => {
            updateSectionOrder({
              sectionId: section.id,
              buildDocId,
              newOrder: index,
              userId: session.user.id || ''
            });
          });
        }
      } else {
        // If changing parent, we need to update the section's parent and order
        const newParentId = overSection.parentSectionId;
        const sectionsWithNewParent = [...(sectionsByParent.get(newParentId) || [])];
        
        // Find the index where the section should be inserted
        const newIndex = sectionsWithNewParent.findIndex(s => s.id === overSection.id);
        
        // Update the section with new parent and order
        updateSectionOrder({
          sectionId: activeSection.id,
          buildDocId,
          newOrder: newIndex,
          newParentId,
          userId: session.user.id || ''
        });
      }
    };
    
    // Recursive function to render section tree
    const renderSections = (parentId: number | null): React.ReactNode[] => {
      const parentSections = sectionsByParent.get(parentId) || [];
      
      if (parentSections.length === 0) {
        return [];
      }
      
      return parentSections.map(section => {
        const sectionId = section.id.toString();
        const hasChildren = sectionsByParent.has(section.id) && sectionsByParent.get(section.id)!.length > 0;
        
        return (
          <SortableItem 
            key={sectionId}
            id={sectionId}
            title={section.title}
            onSelect={(id) => handleSelectSection([id])}
            onAddChild={showAddSectionModal}
            isSelected={selectedSectionId === section.id}
            hasChildren={hasChildren}
            isExpanded={expandedSections[sectionId] === true} // Default to false if not explicitly set to true
            onToggleExpand={handleToggleExpand}
          >
            {hasChildren && renderSections(section.id)}
          </SortableItem>
        );
      });
    };
    
    return (
      <div className="relative">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map(section => section.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            {renderSections(null)}
          </SortableContext>
        </DndContext>
      </div>
    );
  };
  
  // Helper function to get section path
  const getSectionPath = (sectionId: number | null, path: string[] = []): string[] => {
    if (!sectionId) return path;
    
    const section = sections.find(s => s.id === sectionId);
    if (!section) return path;
    
    const newPath = [section.title, ...path];
    return getSectionPath(section.parentSectionId, newPath);
  };

  // Helper function to order sections hierarchically
  const getOrderedSections = () => {
    // We'll build a tree structure first and then flatten it
    const sectionsByParent = getSectionsGroupedByParent(sections);
    const orderedSections: BuildDocSection[] = [];
    
    // Function to recursively add sections in proper order
    const addSectionsInOrder = (parentId: number | null, depth: number = 0) => {
      const childSections = sectionsByParent.get(parentId) || [];
      
      // Add each child and then its descendants
      childSections.forEach(section => {
        // Add the current section
        orderedSections.push({
          ...section,
          // Add a temporary property for depth (used for indentation/visual hierarchy)
          depth
        } as BuildDocSection & { depth: number });
        
        // Add all descendants of this section
        addSectionsInOrder(section.id, depth + 1);
      });
    };
    
    // Start with root sections (those with no parent)
    addSectionsInOrder(null);
    
    return orderedSections;
  };

  // Function to get all section options for parent section dropdown
  const getSectionOptions = () => {
    const orderedSections = getOrderedSections();
    
    return orderedSections.map(section => {
      // Get the full path for this section (excluding the section itself)
      const pathParts = getSectionPath(section.parentSectionId);
      
      if (pathParts.length > 0) {
        // Return with custom rendering that uses different styling for parent sections
        return {
          value: section.id,
          label: (
            <div>
              <span className="text-gray-500">{pathParts.join(' > ')} &gt; </span>
              <span className="font-medium">{section.title}</span>
            </div>
          )
        };
      } else {
        // Simple case for root sections
        return {
          value: section.id,
          label: <span className="font-medium">{section.title}</span>
        };
      }
    });
  };
  
  // Effect to set section content when selection changes
  useEffect(() => {
    if (selectedSectionId) {
      const section = sections.find((s: BuildDocSection) => s.id === selectedSectionId);
      if (section) {
        setSelectedSection(section);
        setSectionContent(section.content || '');
      }
    } else {
      setSelectedSection(null);
      setSectionContent('');
    }
  }, [selectedSectionId, sections]);
  
  // Handle section selection
  const handleSelectSection = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      setSelectedSectionId(parseInt(selectedKeys[0].toString(), 10));
    } else {
      setSelectedSectionId(undefined);
    }
  };
  
  // Handle section content update
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSectionContent(e.target.value);
  };
  
  // Handle saving section content
  const handleSaveContent = () => {
    if (!session?.user?.id || !selectedSection) return;
    
    updateSection({
      id: selectedSection.id,
      buildDocId,
      content: sectionContent,
      userId: session.user.id
    }, {
      onSuccess: () => {
        message.success('Content saved successfully');
        refetchSections();
      }
    });
  };
  
  // Handle adding a new section
  const showAddSectionModal = (parentId?: number, type: 'new' | 'template' = 'new') => {
    setNewSectionParentId(parentId);
    setAddModalType(type);
    setIsAddModalVisible(true);
    form.resetFields();
  };
  
  // Shows the edit modal for a section
  const showEditModal = () => {
    if (!selectedSection) return;
    setIsEditMode(true);
    form.setFieldsValue({
      title: selectedSection.title,
      parentSectionId: selectedSection.parentSectionId
    });
    setIsEditModalVisible(true);
  };
  
  // Handle creating a new section
  const handleCreateSection = (values: { title: string; parentSectionId?: number }) => {
    if (!session?.user?.id) return;
    
    // Use newSectionParentId if it's set, otherwise use the selected parent from the form
    const parentId = newSectionParentId !== undefined ? newSectionParentId : values.parentSectionId;
    
    createSection({
      buildDocId,
      parentSectionId: parentId,
      title: values.title,
      content: '',
      userId: session.user.id
    }, {
      onSuccess: () => {
        setIsAddModalVisible(false);
        setNewSectionParentId(undefined); // Reset the parent ID after creating
        form.resetFields();
        refetchSections();
        message.success('Section created successfully');
      }
    });
  };
  
  // Handle creating from template
  const handleCreateFromTemplate = (values: { templateId: number; parentSectionId?: number }) => {
    if (!session?.user?.id) return;
    
    // Use newSectionParentId if it's set, otherwise use the selected parent from the form
    const parentId = newSectionParentId !== undefined ? newSectionParentId : values.parentSectionId;
    
    createFromTemplate({
      buildDocId,
      parentSectionId: parentId,
      templateId: values.templateId,
      userId: session.user.id
    }, {
      onSuccess: () => {
        setIsAddModalVisible(false);
        setNewSectionParentId(undefined); // Reset the parent ID after creating
        form.resetFields();
        refetchSections();
        message.success('Section created from template successfully');
      }
    });
  };
  
  // Handle form submission for editing sections
  const handleFormSubmit = (values: { title: string; parentSectionId?: number }) => {
    if (isEditMode && selectedSectionId && selectedSection) {
      // Edit existing section
      updateSection({
        id: selectedSectionId,
        buildDocId,
        title: values.title,
        content: sectionContent,
        // Conditionally include parentSectionId if it differs from the current value
        ...(values.parentSectionId !== selectedSection.parentSectionId && { 
          parentSectionId: values.parentSectionId === undefined ? null : values.parentSectionId 
        }),
        userId: session?.user?.id || ''
      }, {
        onSuccess: () => {
          setIsEditModalVisible(false);
          setIsEditMode(false);
          refetchSections();
          message.success('Section updated successfully');
        }
      });
    } else {
      // Add new section
      handleCreateSection(values);
    }
  };
  
  // Handle deleting a section
  const handleDeleteSection = () => {
    if (!selectedSectionId) return;
    
    // Check if this section has children
    const childSections = sections.filter((s: BuildDocSection) => s.parentSectionId === selectedSectionId);
    const hasChildren = childSections.length > 0;
    
    modal.confirm({
      title: 'Are you sure you want to delete this section?',
      content: hasChildren 
        ? `This action cannot be undone and will also delete all ${childSections.length} child section(s).` 
        : 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        deleteSection({
          id: selectedSectionId,
          buildDocId
        }, {
          onSuccess: () => {
            setSelectedSectionId(undefined);
            refetchSections();
            message.success('Section deleted successfully');
          }
        });
      }
    });
  };
  
  // Handle saving section as template
  const handleSaveAsTemplate = () => {
    if (!session?.user?.id || !selectedSection) return;
    
    modal.confirm({
      title: 'Save as Template',
      content: 'Do you want to save just this section, or this section and all its child sections? Saving with child sections will preserve the complete structure.',
      okText: 'Save with Child Sections',
      cancelText: 'Save This Section Only',
      onOk: () => {
        // Save section with all children
        createTemplateFromSection({
          sectionId: selectedSection.id,
          isPublic: true,
          userId: session.user.id || ''
        }, {
          onSuccess: () => {
            message.success('Template with child sections saved successfully');
          },
          onError: () => {
            message.error('Failed to save template with child sections');
          }
        });
      },
      onCancel: () => {
        // Save just this section
        createTemplate({
          title: selectedSection.title,
          content: sectionContent || '',
          isPublic: true,
          userId: session.user.id || ''
        }, {
          onSuccess: () => {
            message.success('Template saved successfully');
          },
          onError: () => {
            message.error('Failed to save template');
          }
        });
      }
    });
  };
  
  // Add section button menu items
  const addSectionMenuItems = [
    {
      key: 'new',
      label: 'New Section',
      icon: <PlusOutlined />,
      onClick: () => showAddSectionModal(undefined)
    },
    {
      key: 'template',
      label: 'From Template',
      icon: <FileAddOutlined />,
      onClick: () => showAddSectionModal(undefined, 'template')
    }
  ];
  
  if (isLoadingDoc || isLoadingSections) {
    return (
      <div className="p-4">
        <Skeleton active />
      </div>
    );
  }
  
  if (!buildDoc) {
    return (
      <div className="p-4">
        <Card>
          <Title level={4}>Build Documentation not found</Title>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      {/* Header */}
      <Card className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <Title level={4}>{buildDoc.title}</Title>
            <Paragraph type="secondary">
              Created: {new Date(buildDoc.createdAt).toLocaleDateString()}
              {' | '}
              Last Updated: {new Date(buildDoc.updatedAt).toLocaleDateString()}
            </Paragraph>
          </div>
          <Space>
            <Button type="primary" icon={<ExportOutlined />}>Export</Button>
          </Space>
        </div>
      </Card>
      
      {/* Main Content */}
      <div className="grid grid-cols-12 gap-4">
        {/* Sections Tree */}
        <div className="col-span-4">
          <Card
            title="Sections"
            extra={
              <Dropdown menu={{ items: addSectionMenuItems }}>
                <Button type="primary" icon={<PlusOutlined />}>
                  Add Section <DownOutlined />
                </Button>
              </Dropdown>
            }
          >
            {sections.length === 0 ? (
              <div className="text-center py-8">
                <Paragraph>No sections yet. Add your first section to get started.</Paragraph>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => showAddSectionModal(undefined)}
                  loading={isCreatingSection}
                >
                  Add Section
                </Button>
                <Button 
                  icon={<FileAddOutlined />} 
                  onClick={() => showAddSectionModal(undefined, 'template')}
                  loading={isCreatingFromTemplate}
                  className="ml-2"
                >
                  From Template
                </Button>
              </div>
            ) : (
              <div className="mt-2">
                <div className="mb-3 text-xs text-gray-500 flex items-center">
                  <HolderOutlined className="mr-1" /> Drag sections to reorder or change parent
                </div>
                <SortableSectionTree />
              </div>
            )}
          </Card>
        </div>
        
        {/* Section Content */}
        <div className="col-span-8">
          {selectedSection ? (
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span>{selectedSection.title}</span>
                  <Space>
                    <Button 
                      onClick={showEditModal}
                      icon={<EditOutlined />}
                    >
                      Edit Title
                    </Button>
                    <Button 
                      icon={<DeleteOutlined />} 
                      danger 
                      onClick={handleDeleteSection}
                      loading={isDeletingSection}
                    >
                      Delete
                    </Button>
                  </Space>
                </div>
              }
            >
              <Tabs
                activeKey={activeTabKey}
                onChange={(key) => setActiveTabKey(key as TabKey)}
                items={[
                  {
                    key: 'edit',
                    label: (
                      <span>
                        <EditOutlined /> Edit
                      </span>
                    ),
                    children: (
                      <div className="space-y-4">
                        <TextArea 
                          rows={12} 
                          value={sectionContent} 
                          onChange={handleContentChange} 
                          placeholder="Enter markdown content here..."
                        />
                        <div className="flex justify-between">
                          <Button 
                            onClick={handleSaveAsTemplate}
                            loading={isCreatingTemplate || isCreatingTemplateFromSection}
                          >
                            Save as Template
                          </Button>
                          <Button 
                            type="primary" 
                            onClick={handleSaveContent}
                            loading={isUpdatingSection}
                          >
                            Save Changes
                          </Button>
                        </div>
                        <Divider orientation="left">Markdown Tips</Divider>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><code># Heading 1</code></p>
                            <p><code>## Heading 2</code></p>
                            <p><code>**Bold text**</code></p>
                            <p><code>*Italic text*</code></p>
                          </div>
                          <div>
                            <p><code>- List item</code></p>
                            <p><code>1. Numbered item</code></p>
                            <p><code>[Link text](url)</code></p>
                            <p><code>![Image alt](image-url)</code></p>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'preview',
                    label: (
                      <span>
                        <EyeOutlined /> Preview
                      </span>
                    ),
                    children: (
                      <div className="prose dark:prose-invert max-w-none border p-4 rounded min-h-[300px] dark:bg-gray-800 bg-white dark:text-gray-100">
                        {sectionContent ? (
                          <div className="dark:text-gray-200">
                            <ReactMarkdown
                              rehypePlugins={[rehypeRaw, [rehypeHighlight, { detect: true }]]}
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({...props}) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                                h2: ({...props}) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
                                h3: ({...props}) => <h3 className="text-lg font-semibold mt-3 mb-2" {...props} />,
                                h4: ({...props}) => <h4 className="text-base font-semibold mt-2 mb-1" {...props} />,
                                h5: ({...props}) => <h5 className="text-sm font-semibold mt-2 mb-1" {...props} />,
                                h6: ({...props}) => <h6 className="text-sm font-semibold mt-2 mb-1" {...props} />,
                                p: ({...props}) => <p className="my-2" {...props} />,
                                ul: ({...props}) => <ul className="list-disc pl-6 my-2" {...props} />,
                                ol: ({...props}) => <ol className="list-decimal pl-6 my-2" {...props} />,
                                li: ({...props}) => <li className="my-1" {...props} />,
                                a: ({...props}) => <a className="text-blue-500 hover:underline" {...props} />,
                                blockquote: ({...props}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic" {...props} />,
                                code: (props) => {
                                  // @ts-expect-error - inline is a valid prop for code components in react-markdown
                                  const isInline = props.inline;
                                  return isInline 
                                    ? <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-red-500 dark:text-red-400" {...props} />
                                    : <code {...props} />;
                                }
                              }}
                            >
                              {sectionContent}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-gray-400 italic dark:text-gray-400">No content to preview</p>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8">
                <Title level={5}>Select a section to view or edit its content</Title>
                <Paragraph>Or create a new section to get started</Paragraph>
              </div>
            </Card>
          )}
        </div>
      </div>
      
      {/* Add/Edit Section Modal */}
      <Modal
        title={isEditMode ? 'Edit Section' : (addModalType === 'new' ? 'Add New Section' : 'Add From Template')}
        open={isEditMode ? isEditModalVisible : isAddModalVisible}
        onCancel={() => {
          if (isEditMode) {
            setIsEditModalVisible(false);
            setIsEditMode(false);
          } else {
            setIsAddModalVisible(false);
          }
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (isEditMode) {
              handleFormSubmit(values as { title: string });
            } else if (addModalType === 'template') {
              handleCreateFromTemplate(values as { templateId: number });
            } else {
              handleCreateSection(values as { title: string });
            }
          }}
        >
          <Form.Item
              name="parentSectionId"
              label="Parent Section"
              initialValue={isEditMode ? undefined : newSectionParentId}
              help="Leave empty to create a top-level section"
            >
              <Select 
                placeholder="Select a parent section" 
                allowClear
                options={
                  isEditMode 
                    // In edit mode, filter out the current section and its children
                    // to prevent circular references
                    ? getSectionOptions().filter(option => {
                        const optionId = option.value as number;
                        return optionId !== selectedSectionId;
                      }) 
                    : getSectionOptions()
                }
                disabled={!isEditMode && !!newSectionParentId} // Disable if pre-selected from tree and not in edit mode
              />
            </Form.Item>
          
          {addModalType === 'template' && !isEditMode ? (
            <Form.Item
              name="templateId"
              label="Select Template"
              rules={[{ required: true, message: 'Please select a template' }]}
            >
              <Select 
                placeholder="Select a template"
                style={{ width: '100%' }}
                options={
                  templates.map((template) => ({
                    label: template.title,
                    value: template.id
                  }))
                }
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="title"
              label="Section Title"
              rules={[{ required: true, message: 'Please enter a section title' }]}
            >
              <Input placeholder="e.g., Installing Nginx" />
            </Form.Item>
          )}
          
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => {
                if (isEditMode) {
                  setIsEditModalVisible(false);
                  setIsEditMode(false);
                } else {
                  setIsAddModalVisible(false);
                }
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={isEditMode ? isUpdatingSection : (addModalType === 'template' ? isCreatingFromTemplate : isCreatingSection)}>
                {isEditMode ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}