"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useLoggedInUser from "@/features/auth/hooks/useLoggedInUser";
import { useTemplates } from "@/features/templates/hooks/useTemplates";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { CreateTemplateModal } from "@/features/admin/components/CreateTemplateModal";
import TemplateCard from "@/components/template-card";
import {
  FileImage,
  Search,
  Upload,
  Download,
  Edit,
  Trash2,
  MoreHorizontal,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Eye,
  AlertCircle,
  Filter,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function TemplatesPage() {
  const router = useRouter();
  const { user, isAdmin } = useLoggedInUser();
  const { templates, deleteTemplate, isDeleting, isLoading } = useTemplates();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("grid");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/signin");
    }
  }, [user, router]);

  const handleDownload = async (templateId: string, templateTitle: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/templates/${templateId}/download`,
        {
          credentials: "include",
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${templateTitle}_template`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Template downloaded successfully!");
      } else {
        const errorData = await response.json();
        if (response.status === 402) {
          toast.error("Premium access required for downloads");
          router.push("/payment");
        } else {
          toast.error(errorData.detail || "Failed to download template");
        }
      }
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      await deleteTemplate(templateId);
    }
  };

  // Filter and sort templates
  const filteredAndSortedTemplates = templates?.templates
    ?.filter(
      (template) =>
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        template.uploaded_by.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    ?.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "uploaded_by":
          aValue = a.uploaded_by.toLowerCase();
          bValue = b.uploaded_by.toLowerCase();
          break;
        case "created_at":
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  const AdminTemplateView = () => (
    <>
      {/* Admin Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileImage className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Template Management
            </h1>
          </div>
          <p className="text-gray-600">
            Upload, manage, and organize templates for users
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Template
        </Button>
      </div>

      {/* Admin Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Template Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="uploaded_by">Uploader</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <SortAsc /> : <SortDesc />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedTemplates?.map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <div className="aspect-video bg-gray-100 relative">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${template.image_url}`}
                alt={template.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  {template.description && (
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        toast("Edit functionality coming soon");
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={isDeleting}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>By {template.uploaded_by}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(template.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );

  const UserTemplateView = () => (
    <>
      {/* User Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileImage className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Template Library</h1>
        </div>
        <p className="text-gray-600">
          Browse and download templates from our collection
        </p>
      </div>

      {/* User Filters and View Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Browse Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Newest</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="uploaded_by">Creator</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? <SortAsc /> : <SortDesc />}
              </Button>
              <div className="flex border rounded">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Template Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedTemplates?.map((template) => (
            <TemplateCard
              key={template.id}
              template={{
                id: template.id,
                title: template.title,
                description: template.description,
                image_url: template.image_url,
                uploaded_by: template.uploaded_by,
                created_at: template.created_at,
                updated_at: template.updated_at,
              }}
              variant="grid"
              enableScreenshotProtection={true}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedTemplates?.map((template) => (
            <TemplateCard
              key={template.id}
              template={{
                id: template.id,
                title: template.title,
                description: template.description,
                image_url: template.image_url,
                uploaded_by: template.uploaded_by,
                created_at: template.created_at,
                updated_at: template.updated_at,
              }}
              variant="list"
              enableScreenshotProtection={true}
            />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdmin ? <AdminTemplateView /> : <UserTemplateView />}

        {/* Empty State */}
        {filteredAndSortedTemplates?.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileImage className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No templates found" : "No templates yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "Try adjusting your search criteria"
                : isAdmin
                  ? "Upload your first template to get started"
                  : "Templates will appear here once uploaded by administrators"}
            </p>
            {isAdmin && !searchTerm && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload First Template
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Payment Modal for Users */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Screenshot Detected
            </h2>
            <p className="text-gray-600 mb-6">
              Screenshot protection is enabled. To access this content, please
              upgrade to premium.
            </p>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowPaymentModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPaymentModal(false);
                  router.push("/payment");
                }}
                className="flex-1"
              >
                Upgrade to Premium
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal for Admins */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
