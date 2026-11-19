import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Quote,
  Tags,
  Database,
  Plus,
  Search,
  Edit3,
  Trash2,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageCircle,
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import type {
  Enquiry,
  EnquiryStatus,
  Property,
  PropertyAvailability,
  PropertyCategory,
  Testimonial,
} from '../types/database';
import {
  createCategory,
  deleteCategory,
  deleteEnquiry,
  deletePropertyWithMedia,
  deleteTestimonial,
  fetchAllPropertiesAdmin,
  fetchAllTestimonialsAdmin,
  fetchCategories,
  fetchEnquiries,
  saveTestimonial,
  toggleCategoryActive,
  updateEnquiryStatus,
  updatePropertyAvailability,
} from '../services/realEstateService';
import { buildWhatsAppUrl, formatDateShort, formatNaira } from '../lib/formatters';
import { PropertyFormModal } from '../components/admin/PropertyFormModal';
import { SupabaseSettingsPanel } from '../components/admin/SupabaseSettingsPanel';
import { SeoHead } from '../components/SeoHead';

type AdminTab =
  | 'overview'
  | 'properties'
  | 'enquiries'
  | 'testimonials'
  | 'categories'
  | 'supabase';

export function AdminDashboardPage() {
  const {
    supabase,
    connectionStatus,
    user,
    isAdmin,
    authLoading,
    signOut,
    showToast,
  } = useSupabase();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Property filters & modals
  const [propSearch, setPropSearch] = useState('');
  const [propStatusFilter, setPropStatusFilter] = useState('');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState(false);

  // Enquiry deletion confirmation
  const [enquiryToDelete, setEnquiryToDelete] = useState<Enquiry | null>(null);

  // Testimonial editor state
  const [testimonialForm, setTestimonialForm] = useState({
    id: '',
    client_name: '',
    client_role: '',
    location: '',
    quote: '',
    is_published: true,
  });
  const [savingTestimonial, setSavingTestimonial] = useState(false);

  // Category creation state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin/login', { replace: true });
    }
  }, [authLoading, isAdmin, navigate]);

  const loadDashboardData = useCallback(async () => {
    if (!supabase || !isAdmin) return;
    setLoadingData(true);
    try {
      const [props, enqs, revs, cats] = await Promise.all([
        fetchAllPropertiesAdmin(supabase),
        fetchEnquiries(supabase),
        fetchAllTestimonialsAdmin(supabase),
        fetchCategories(supabase),
      ]);
      setProperties(props);
      setEnquiries(enqs);
      setTestimonials(revs);
      setCategories(cats);
    } catch (err) {
      showToast(
        'error',
        'Failed to Load Dashboard Data',
        err instanceof Error ? err.message : 'Check Supabase schema and RLS permissions.'
      );
    } finally {
      setLoadingData(false);
    }
  }, [supabase, isAdmin, showToast]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  // Overview KPI Metrics
  const kpis = useMemo(() => {
    return {
      totalProperties: properties.length,
      forSale: properties.filter((p) => p.listing_type === 'sale').length,
      forRent: properties.filter((p) => p.listing_type === 'rent').length,
      available: properties.filter((p) => p.availability === 'Available').length,
      sold: properties.filter((p) => p.availability === 'Sold').length,
      rented: properties.filter((p) => p.availability === 'Rented').length,
      totalEnquiries: enquiries.length,
    };
  }, [properties, enquiries]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (propStatusFilter && p.availability !== propStatusFilter) return false;
      if (propSearch.trim()) {
        const q = propSearch.trim().toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [properties, propSearch, propStatusFilter]);

  const handleQuickStatusChange = async (
    property: Property,
    nextStatus: PropertyAvailability
  ) => {
    if (!supabase) return;
    try {
      await updatePropertyAvailability(supabase, property.id, nextStatus);
      setProperties((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, availability: nextStatus } : p))
      );
      showToast('success', 'Status Updated', `${property.title} marked as ${nextStatus}.`);
    } catch (err) {
      showToast('error', 'Update Failed', err instanceof Error ? err.message : 'Error updating status.');
    }
  };

  const handleConfirmDeleteProperty = async () => {
    if (!supabase || !propertyToDelete) return;
    setDeletingProperty(true);
    try {
      await deletePropertyWithMedia(supabase, propertyToDelete);
      setProperties((prev) => prev.filter((p) => p.id !== propertyToDelete.id));
      showToast(
        'success',
        'Property Deleted',
        `${propertyToDelete.title} and its uploaded media have been removed.`
      );
      setPropertyToDelete(null);
    } catch (err) {
      showToast('error', 'Delete Failed', err instanceof Error ? err.message : 'Could not delete property.');
    } finally {
      setDeletingProperty(false);
    }
  };

  const handleEnquiryStatusChange = async (enquiry: Enquiry, status: EnquiryStatus) => {
    if (!supabase) return;
    try {
      await updateEnquiryStatus(supabase, enquiry.id, status);
      setEnquiries((prev) => prev.map((e) => (e.id === enquiry.id ? { ...e, status } : e)));
      showToast('success', 'Enquiry Updated', `Marked as ${status}.`);
    } catch (err) {
      showToast('error', 'Update Failed', err instanceof Error ? err.message : 'Error updating enquiry.');
    }
  };

  const handleConfirmDeleteEnquiry = async () => {
    if (!supabase || !enquiryToDelete) return;
    try {
      await deleteEnquiry(supabase, enquiryToDelete.id);
      setEnquiries((prev) => prev.filter((e) => e.id !== enquiryToDelete.id));
      setEnquiryToDelete(null);
      showToast('success', 'Enquiry Removed', 'Customer enquiry deleted.');
    } catch (err) {
      showToast('error', 'Delete Failed', err instanceof Error ? err.message : 'Could not delete enquiry.');
    }
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSavingTestimonial(true);
    try {
      await saveTestimonial(supabase, {
        id: testimonialForm.id || undefined,
        client_name: testimonialForm.client_name,
        client_role: testimonialForm.client_role,
        location: testimonialForm.location,
        quote: testimonialForm.quote,
        is_published: testimonialForm.is_published,
      });
      setTestimonialForm({
        id: '',
        client_name: '',
        client_role: '',
        location: '',
        quote: '',
        is_published: true,
      });
      await loadDashboardData();
      showToast('success', 'Testimonial Saved', 'Customer testimonial updated.');
    } catch (err) {
      showToast('error', 'Save Failed', err instanceof Error ? err.message : 'Error saving testimonial.');
    } finally {
      setSavingTestimonial(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!supabase) return;
    try {
      await deleteTestimonial(supabase, id);
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      showToast('success', 'Testimonial Deleted', 'Review removed.');
    } catch (err) {
      showToast('error', 'Delete Failed', err instanceof Error ? err.message : 'Could not delete.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const created = await createCategory(supabase, newCategoryName, categories.length + 1);
      setCategories((prev) => [...prev, created]);
      setNewCategoryName('');
      showToast('success', 'Category Added', `${created.name} is now available.`);
    } catch (err) {
      showToast('error', 'Add Failed', err instanceof Error ? err.message : 'Could not add category.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleToggleCategory = async (cat: PropertyCategory) => {
    if (!supabase) return;
    try {
      await toggleCategoryActive(supabase, cat.id, !cat.is_active);
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
      );
    } catch (err) {
      showToast('error', 'Update Failed', err instanceof Error ? err.message : 'Error updating category.');
    }
  };

  const handleDeleteCategory = async (cat: PropertyCategory) => {
    if (!supabase) return;
    try {
      await deleteCategory(supabase, cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      showToast('success', 'Category Deleted', `${cat.name} removed.`);
    } catch (err) {
      showToast('error', 'Delete Failed', err instanceof Error ? err.message : 'Could not delete category.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
        <span className="text-sm">Verifying Administrator Session...</span>
      </div>
    );
  }

  if (!isAdmin) return null;

  const navTabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'enquiries', label: 'Enquiries', icon: MessageSquare },
    { id: 'testimonials', label: 'Testimonials', icon: Quote },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'supabase', label: 'Supabase Settings', icon: Database },
  ];

  const activeTabLabel = navTabs.find((t) => t.id === activeTab)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-950 flex">
      <SeoHead
        title={`${activeTabLabel} – Admin Dashboard | ADA REAL ESTATE`}
        description="ADA REAL ESTATE Administrator Dashboard connected to Supabase."
      />

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-neutral-950 text-white flex flex-col justify-between border-r border-neutral-800 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          <div className="h-16 px-5 border-b border-neutral-800 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 whitespace-nowrap">
              <span className="w-6 h-6 border border-[#D4AF37] flex items-center justify-center text-[11px] font-serif font-bold text-[#D4AF37]">
                A
              </span>
              <span className="font-serif text-sm font-semibold tracking-[0.14em] text-white">
                ADA ADMIN
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium tracking-wide transition-colors ${
                    isActive
                      ? 'bg-[#D4AF37] text-neutral-950 font-semibold'
                      : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-neutral-800 space-y-3">
          <div className="text-xs text-neutral-400 truncate">
            <span className="block text-[10px] uppercase tracking-wider text-neutral-500">
              Signed in as
            </span>
            <span className="text-neutral-200">{user?.email}</span>
          </div>

          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Public Site
          </Link>

          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-neutral-900 text-neutral-300 hover:text-red-400"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="lg:hidden p-2 -ml-2 text-neutral-700 hover:text-neutral-950"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500 truncate">
              <span>ADA REAL ESTATE</span>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-neutral-950">{activeTabLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('supabase')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-neutral-200 bg-[#FAF9F6] text-neutral-700 hover:border-neutral-400 whitespace-nowrap"
            >
              {connectionStatus === 'Connected' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              )}
              {connectionStatus === 'Connection Error' && (
                <XCircle className="w-3.5 h-3.5 text-red-600" />
              )}
              {connectionStatus === 'Not Connected' && (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>{connectionStatus}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingProperty(null);
                setShowPropertyModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-950 text-[#D4AF37] hover:bg-neutral-800 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add New Property
            </button>
          </div>
        </header>

        {/* Viewport Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {loadingData && activeTab !== 'supabase' ? (
            <div className="flex items-center justify-center py-20 gap-3 text-neutral-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-[#B5892E]" />
              Loading live data from Supabase...
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Properties', value: kpis.totalProperties },
                      { label: 'Properties for Sale', value: kpis.forSale },
                      { label: 'Properties for Rent', value: kpis.forRent },
                      { label: 'Available Properties', value: kpis.available },
                      { label: 'Sold Properties', value: kpis.sold },
                      { label: 'Rented Properties', value: kpis.rented },
                      { label: 'Total Enquiries', value: kpis.totalEnquiries },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-white border border-neutral-200 p-5 space-y-2"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                          {stat.label}
                        </p>
                        <p className="font-mono tabular-nums text-3xl font-semibold text-neutral-950">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Recent Properties & Recent Enquiries */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-neutral-200 p-6 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                        <h2 className="font-serif text-xl font-semibold">Recent Listings</h2>
                        <button
                          type="button"
                          onClick={() => setActiveTab('properties')}
                          className="text-xs font-semibold uppercase tracking-wider text-[#99711C]"
                        >
                          Manage All
                        </button>
                      </div>
                      {properties.length === 0 ? (
                        <p className="text-sm text-neutral-500 py-4">
                          No properties uploaded yet. Click &ldquo;Add New Property&rdquo; to publish
                          your first listing.
                        </p>
                      ) : (
                        <div className="divide-y divide-neutral-100">
                          {properties.slice(0, 5).map((p) => (
                            <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-neutral-950 truncate">
                                  {p.title}
                                </p>
                                <p className="text-xs text-neutral-500 truncate">
                                  {p.location} · {p.availability}
                                </p>
                              </div>
                              <span className="font-mono tabular-nums text-xs font-semibold text-neutral-900 shrink-0">
                                {formatNaira(p.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-neutral-200 p-6 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                        <h2 className="font-serif text-xl font-semibold">Recent Enquiries</h2>
                        <button
                          type="button"
                          onClick={() => setActiveTab('enquiries')}
                          className="text-xs font-semibold uppercase tracking-wider text-[#99711C]"
                        >
                          View All
                        </button>
                      </div>
                      {enquiries.length === 0 ? (
                        <p className="text-sm text-neutral-500 py-4">
                          No customer enquiries recorded yet.
                        </p>
                      ) : (
                        <div className="divide-y divide-neutral-100">
                          {enquiries.slice(0, 5).map((enq) => (
                            <div key={enq.id} className="py-3 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-neutral-950 truncate">
                                  {enq.customer_name}
                                </p>
                                <p className="text-xs text-neutral-500 truncate">
                                  {enq.property_title || enq.enquiry_type} · {enq.phone_number}
                                </p>
                              </div>
                              <span className="text-xs font-medium text-neutral-600 shrink-0">
                                {enq.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PROPERTIES MANAGEMENT */}
              {activeTab === 'properties' && (
                <div className="space-y-5">
                  <div className="bg-white border border-neutral-200 p-4 flex flex-col sm:flex-row gap-3 justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={propSearch}
                        onChange={(e) => setPropSearch(e.target.value)}
                        placeholder="Search by title, location, or category..."
                        className="w-full bg-[#FAF9F6] border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#B5892E]"
                      />
                    </div>
                    <select
                      value={propStatusFilter}
                      onChange={(e) => setPropStatusFilter(e.target.value)}
                      className="bg-[#FAF9F6] border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#B5892E]"
                    >
                      <option value="">All Statuses</option>
                      <option value="Available">Available</option>
                      <option value="Sold">Sold</option>
                      <option value="Rented">Rented</option>
                    </select>
                  </div>

                  {filteredProperties.length === 0 ? (
                    <div className="bg-white border border-neutral-200 p-12 text-center space-y-3">
                      <Building2 className="w-10 h-10 text-[#B5892E] mx-auto" />
                      <h3 className="font-serif text-2xl font-semibold">No Properties Found</h3>
                      <p className="text-sm text-neutral-600">
                        Upload your first property listing with images and video to display it on
                        the public website.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProperty(null);
                          setShowPropertyModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-neutral-950 text-[#D4AF37]"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Property
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white border border-neutral-200 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-200 bg-[#FAF9F6] text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                            <th className="py-3.5 px-4">Property</th>
                            <th className="py-3.5 px-4">Category</th>
                            <th className="py-3.5 px-4">Location</th>
                            <th className="py-3.5 px-4 text-right">Price</th>
                            <th className="py-3.5 px-4">Availability</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 text-sm">
                          {filteredProperties.map((prop) => {
                            const thumb =
                              prop.property_images?.find((i) => i.is_main) ||
                              prop.property_images?.[0];
                            return (
                              <tr key={prop.id} className="hover:bg-[#FAF9F6]/70">
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-14 h-10 bg-neutral-900 shrink-0 overflow-hidden border border-neutral-200">
                                      {thumb ? (
                                        <img
                                          src={thumb.public_url}
                                          alt={prop.title}
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                          <Building2 className="w-4 h-4" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-neutral-950 truncate max-w-[240px]">
                                        {prop.title}
                                      </p>
                                      <p className="text-xs text-neutral-500">
                                        {prop.property_images?.length || 0} photos ·{' '}
                                        {prop.property_videos?.length || 0} videos
                                        {!prop.is_published && ' · Draft'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-xs text-neutral-700 whitespace-nowrap">
                                  {prop.category}
                                </td>
                                <td className="py-3.5 px-4 text-xs text-neutral-700 max-w-[180px] truncate">
                                  {prop.location}
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium whitespace-nowrap">
                                  {formatNaira(prop.price)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <select
                                    value={prop.availability}
                                    onChange={(e) =>
                                      void handleQuickStatusChange(
                                        prop,
                                        e.target.value as PropertyAvailability
                                      )
                                    }
                                    aria-label={`Change status for ${prop.title}`}
                                    className="bg-white border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-800 focus:outline-none focus:border-[#B5892E]"
                                  >
                                    <option value="Available">Available</option>
                                    <option value="Sold">Sold</option>
                                    <option value="Rented">Rented</option>
                                  </select>
                                </td>
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-2">
                                    <Link
                                      to={`/properties/${prop.id}`}
                                      target="_blank"
                                      title="View Live Page"
                                      className="p-1.5 text-neutral-500 hover:text-neutral-950"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingProperty(prop);
                                        setShowPropertyModal(true);
                                      }}
                                      title="Edit Property"
                                      className="p-1.5 text-neutral-700 hover:text-[#99711C]"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPropertyToDelete(prop)}
                                      title="Delete Property"
                                      className="p-1.5 text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ENQUIRIES */}
              {activeTab === 'enquiries' && (
                <div className="space-y-5">
                  {enquiries.length === 0 ? (
                    <div className="bg-white border border-neutral-200 p-12 text-center space-y-2">
                      <MessageSquare className="w-10 h-10 text-[#B5892E] mx-auto" />
                      <h3 className="font-serif text-2xl font-semibold">No Enquiries Yet</h3>
                      <p className="text-sm text-neutral-600">
                        Customer inspection requests and contact form messages appear here
                        automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border border-neutral-200 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-200 bg-[#FAF9F6] text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                            <th className="py-3.5 px-4">Customer</th>
                            <th className="py-3.5 px-4">Property Interested In</th>
                            <th className="py-3.5 px-4">Message</th>
                            <th className="py-3.5 px-4">Date</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 text-sm">
                          {enquiries.map((enq) => (
                            <tr key={enq.id} className="align-top hover:bg-[#FAF9F6]/70">
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <p className="font-semibold text-neutral-950">
                                  {enq.customer_name}
                                </p>
                                <p className="text-xs font-mono tabular-nums text-neutral-600">
                                  {enq.phone_number}
                                </p>
                                {enq.email && (
                                  <p className="text-xs text-neutral-500">{enq.email}</p>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-xs text-neutral-800 max-w-[200px]">
                                <p className="font-medium">
                                  {enq.property_title || 'General Advisory'}
                                </p>
                                <p className="text-neutral-500 mt-0.5">{enq.enquiry_type}</p>
                              </td>
                              <td className="py-3.5 px-4 text-xs text-neutral-700 max-w-xs leading-relaxed">
                                {enq.message}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-neutral-500 whitespace-nowrap">
                                {formatDateShort(enq.created_at)}
                              </td>
                              <td className="py-3.5 px-4">
                                <select
                                  value={enq.status}
                                  onChange={(e) =>
                                    void handleEnquiryStatusChange(
                                      enq,
                                      e.target.value as EnquiryStatus
                                    )
                                  }
                                  className="bg-white border border-neutral-300 px-2.5 py-1 text-xs font-medium"
                                >
                                  <option value="New">New</option>
                                  <option value="Contacted">Contacted</option>
                                  <option value="Scheduled">Scheduled</option>
                                  <option value="Closed">Closed</option>
                                </select>
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-2">
                                  <a
                                    href={buildWhatsAppUrl(
                                      `Hello ${enq.customer_name}, thank you for contacting ADA REAL ESTATE regarding ${enq.property_title || 'your property enquiry'}.`
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Reply via WhatsApp"
                                    className="p-1.5 text-emerald-700 hover:text-emerald-900"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => setEnquiryToDelete(enq)}
                                    title="Delete Enquiry"
                                    className="p-1.5 text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TESTIMONIALS */}
              {activeTab === 'testimonials' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <form
                    onSubmit={handleSaveTestimonial}
                    className="lg:col-span-5 bg-white border border-neutral-200 p-6 space-y-4"
                  >
                    <h2 className="font-serif text-xl font-semibold">
                      {testimonialForm.id ? 'Edit Testimonial' : 'Add Genuine Client Testimonial'}
                    </h2>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                        Client Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={testimonialForm.client_name}
                        onChange={(e) =>
                          setTestimonialForm((f) => ({ ...f, client_name: e.target.value }))
                        }
                        placeholder="e.g. Mrs. Ngozi Eze"
                        className="w-full bg-[#FAF9F6] border border-neutral-300 px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                        Client Role / Transaction *
                      </label>
                      <input
                        type="text"
                        required
                        value={testimonialForm.client_role}
                        onChange={(e) =>
                          setTestimonialForm((f) => ({ ...f, client_role: e.target.value }))
                        }
                        placeholder="e.g. Homebuyer / Landlord"
                        className="w-full bg-[#FAF9F6] border border-neutral-300 px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                        Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={testimonialForm.location}
                        onChange={(e) =>
                          setTestimonialForm((f) => ({ ...f, location: e.target.value }))
                        }
                        placeholder="e.g. Port Harcourt / Lekki, Lagos"
                        className="w-full bg-[#FAF9F6] border border-neutral-300 px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                        Testimonial Quote *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={testimonialForm.quote}
                        onChange={(e) =>
                          setTestimonialForm((f) => ({ ...f, quote: e.target.value }))
                        }
                        placeholder="Verified client experience..."
                        className="w-full bg-[#FAF9F6] border border-neutral-300 px-3.5 py-2 text-sm"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={testimonialForm.is_published}
                        onChange={(e) =>
                          setTestimonialForm((f) => ({ ...f, is_published: e.target.checked }))
                        }
                        className="w-4 h-4 accent-[#99711C]"
                      />
                      Publish on Homepage
                    </label>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={savingTestimonial}
                        className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-neutral-950 text-[#D4AF37]"
                      >
                        {savingTestimonial ? 'Saving...' : 'Save Testimonial'}
                      </button>
                      {testimonialForm.id && (
                        <button
                          type="button"
                          onClick={() =>
                            setTestimonialForm({
                              id: '',
                              client_name: '',
                              client_role: '',
                              location: '',
                              quote: '',
                              is_published: true,
                            })
                          }
                          className="px-4 py-2.5 text-xs border border-neutral-300"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="lg:col-span-7 space-y-4">
                    {testimonials.length === 0 ? (
                      <div className="bg-white border border-neutral-200 p-10 text-center text-sm text-neutral-500">
                        No client testimonials added yet. Only genuine testimonials you publish here
                        appear on the homepage.
                      </div>
                    ) : (
                      testimonials.map((t) => (
                        <div
                          key={t.id}
                          className="bg-white border border-neutral-200 p-5 flex items-start justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <p className="text-sm text-neutral-800 leading-relaxed">
                              &ldquo;{t.quote}&rdquo;
                            </p>
                            <p className="text-xs font-semibold text-neutral-950">
                              {t.client_name} ·{' '}
                              <span className="font-normal text-neutral-500">
                                {t.client_role}, {t.location}
                              </span>{' '}
                              ·{' '}
                              <span className={t.is_published ? 'text-emerald-700' : 'text-amber-700'}>
                                {t.is_published ? 'Published' : 'Hidden'}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setTestimonialForm({
                                  id: t.id,
                                  client_name: t.client_name,
                                  client_role: t.client_role,
                                  location: t.location,
                                  quote: t.quote,
                                  is_published: t.is_published,
                                })
                              }
                              className="p-1.5 text-neutral-600 hover:text-neutral-950"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteTestimonial(t.id)}
                              className="p-1.5 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: CATEGORIES */}
              {activeTab === 'categories' && (
                <div className="max-w-3xl space-y-6">
                  <form
                    onSubmit={handleAddCategory}
                    className="bg-white border border-neutral-200 p-5 flex flex-col sm:flex-row gap-3"
                  >
                    <input
                      type="text"
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New property category name..."
                      className="flex-1 bg-[#FAF9F6] border border-neutral-300 px-3.5 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={savingCategory}
                      className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-neutral-950 text-[#D4AF37] whitespace-nowrap"
                    >
                      {savingCategory ? 'Adding...' : 'Add Category'}
                    </button>
                  </form>

                  <div className="bg-white border border-neutral-200 divide-y divide-neutral-200">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm"
                      >
                        <div>
                          <span className="font-medium text-neutral-950">{cat.name}</span>
                          <span className="ml-3 text-xs text-neutral-500">
                            {cat.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => void handleToggleCategory(cat)}
                            className="text-xs font-semibold text-[#99711C] hover:underline"
                          >
                            {cat.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteCategory(cat)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: SUPABASE CONNECTION SETTINGS */}
              {activeTab === 'supabase' && (
                <div className="max-w-3xl">
                  <SupabaseSettingsPanel />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Add / Edit Property Modal */}
      {showPropertyModal && (
        <PropertyFormModal
          property={editingProperty}
          categories={categories}
          onClose={() => setShowPropertyModal(false)}
          onSaved={() => {
            setShowPropertyModal(false);
            void loadDashboardData();
          }}
        />
      )}

      {/* Property Delete Confirmation Dialog */}
      {propertyToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-serif text-2xl font-semibold text-neutral-950">
              Confirm Property Deletion
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong>{propertyToDelete.title}</strong>? All associated photos and videos in
              Supabase Storage will also be removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingProperty}
                onClick={() => setPropertyToDelete(null)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingProperty}
                onClick={() => void handleConfirmDeleteProperty()}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-red-600 text-white hover:bg-red-700"
              >
                {deletingProperty && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enquiry Delete Confirmation Dialog */}
      {enquiryToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-serif text-2xl font-semibold text-neutral-950">
              Delete Customer Enquiry
            </h3>
            <p className="text-sm text-neutral-600">
              Remove enquiry from <strong>{enquiryToDelete.customer_name}</strong>? This cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEnquiryToDelete(null)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeleteEnquiry()}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
