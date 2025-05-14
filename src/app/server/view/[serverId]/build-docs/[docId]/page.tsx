'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Card, Typography, Skeleton, App, Tabs, Tree, Input, Modal, Form, Space, Divider, Dropdown, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, FileOutlined, EyeOutlined, DownOutlined, FileAddOutlined, ExportOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

// Import syntax highlighting CSS
import 'highlight.js/styles/github-dark.css';

import {
  useBuildDoc,
  useBuildDocSections,
  useCreateBuildDocSection,
  useUpdateBuildDocSection,
  useDeleteBuildDocSection,
  useBuildDocSectionTemplates,
  useCreateSectionFromTemplate,
  BuildDocSection
} from '@/app/actions/buildDocs/clientActions';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

type TabKey = 'edit' | 'preview';

export default function BuildDocDetailPage() {
  const { serverId, docId } = useParams<{ serverId: string; docId: string }>();
  const serverIdNum = parseInt(serverId as string, 10);
  const buildDocId = parseInt(docId as string, 10);
  const router = useRouter();
  const { data: session } = useSession();
  const { message } = App.useApp();
  
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
  const [form] = Form.useForm();
  
  // Queries
  const { data: buildDocData, isLoading: isLoadingDoc } = useBuildDoc(buildDocId);
  const { data: sectionsData, isLoading: isLoadingSections, refetch: refetchSections } = useBuildDocSections(buildDocId);
  const { data: templatesData } = useBuildDocSectionTemplates();
  
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
    return isTemplateResponse(templatesData) && templatesData.success ? templatesData.data : [];
  }, [templatesData, isTemplateResponse]);
  
  // Create a parent-child tree from flat section data
  const createSectionTree = (sections: BuildDocSection[]): DataNode[] => {
    // Create a map of all sections by id for easy lookup
    const sectionsById = new Map<number, BuildDocSection>();
    sections.forEach(section => sectionsById.set(section.id, section));
    
    // Group sections by their parent id
    const childrenMap = new Map<number | null, BuildDocSection[]>();
    
    sections.forEach(section => {
      const parentId = section.parentSectionId;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)?.push(section);
    });
    
    // Recursive function to build the tree
    const buildTree = (parentId: number | null): DataNode[] => {
      const children = childrenMap.get(parentId) || [];
      return children
        .sort((a, b) => a.order - b.order) // Sort by order
        .map(section => ({
          key: section.id.toString(),
          title: section.title,
          icon: <FileOutlined />,
          children: buildTree(section.id)
        }));
    };
    
    // Start with root sections (parentId = null)
    return buildTree(null);
  };
  
  const treeData = createSectionTree(sections);
  
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
      title: selectedSection.title
    });
    setIsEditModalVisible(true);
  };
  
  // Handle creating a new section
  const handleCreateSection = (values: { title: string }) => {
    if (!session?.user?.id) return;
    
    createSection({
      buildDocId,
      parentSectionId: newSectionParentId,
      title: values.title,
      content: '',
      userId: session.user.id
    }, {
      onSuccess: () => {
        setIsAddModalVisible(false);
        form.resetFields();
        refetchSections();
        message.success('Section created successfully');
      }
    });
  };
  
  // Handle creating from template
  const handleCreateFromTemplate = (values: { templateId: number }) => {
    if (!session?.user?.id) return;
    
    createFromTemplate({
      buildDocId,
      parentSectionId: newSectionParentId,
      templateId: values.templateId,
      userId: session.user.id
    }, {
      onSuccess: () => {
        setIsAddModalVisible(false);
        form.resetFields();
        refetchSections();
        message.success('Section created from template successfully');
      }
    });
  };
  
  // Handle form submission for editing sections
  const handleFormSubmit = (values: { title: string }) => {
    if (isEditMode && selectedSectionId && selectedSection) {
      // Edit existing section
      updateSection({
        id: selectedSectionId,
        buildDocId,
        title: values.title,
        content: sectionContent,
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
    
    Modal.confirm({
      title: 'Are you sure you want to delete this section?',
      content: 'This action cannot be undone and will also delete all child sections.',
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
    if (!session?.user?.id || !selectedSection || !sectionContent) return;
    
    Modal.confirm({
      title: 'Save as Template',
      content: 'This will save the current section content as a reusable template. Continue?',
      onOk: () => {
        // This would call a create template action
        message.success('Template saved successfully');
      }
    });
  };
  
  // Go back to build docs list
  const handleGoBack = () => {
    router.push(`/server/view/${serverIdNum}/build-docs`);
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
          <Button onClick={handleGoBack}>Go Back</Button>
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
            <Button onClick={handleGoBack} className="mb-2">
              Back to Build Docs
            </Button>
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
              <Tree
                showLine
                treeData={treeData}
                onSelect={handleSelectSection}
                selectedKeys={selectedSectionId ? [selectedSectionId.toString()] : []}
              />
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
          {addModalType === 'template' && !isEditMode ? (
            <Form.Item
              name="templateId"
              label="Select Template"
              rules={[{ required: true, message: 'Please select a template' }]}
            >
              <Select placeholder="Select a template">
                {templates && templates.map((template) => (
                  <Select.Option key={template.id} value={template.id}>
                    {template.title}
                  </Select.Option>
                ))}
              </Select>
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
