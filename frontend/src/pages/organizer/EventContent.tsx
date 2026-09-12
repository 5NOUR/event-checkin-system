import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Mic,
  Calendar,
  HelpCircle,
  Handshake,
  Camera,
  DoorOpen,
  Ticket,
  Plus,
  Trash2,
  MapPin,
  Award,
  ExternalLink,
} from "lucide-react";
import apiClient from "../../services/apiClient";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Badge } from "../../components/ui/Badge";
import { Card, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoader } from "../../components/ui/Spinner";
import { Tabs, type Tab } from "../../components/ui/Tabs";

// ============ TYPES ============
interface Speaker {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  imageUrl: string | null;
  order: number;
}

interface AgendaItem {
  id: string;
  time: string;
  title: string;
  description: string | null;
  speakerId: string | null;
  speaker: Speaker | null;
  order: number;
}

interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: string | null;
  order: number;
}

interface GalleryImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  order: number;
}

interface Gate {
  id: string;
  name: string;
  location: string | null;
  isActive: boolean;
  order: number;
  _count?: { checkIns: number };
}

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  capacity: number | null;
  price: number | null;
  isActive: boolean;
  order: number;
  _count?: { registrations: number };
}

type TabId =
  | "speakers"
  | "agenda"
  | "faqs"
  | "sponsors"
  | "gallery"
  | "gates"
  | "ticketTypes";

// ============ MAIN COMPONENT ============
export default function EventContent() {
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("speakers");

  // ========== FETCH ==========
  const speakersQuery = useQuery({
    queryKey: ["speakers", eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/content/event/${eventId}/speakers`);
      return res.data.data as Speaker[];
    },
    enabled: !!eventId,
  });

  const agendaQuery = useQuery({
    queryKey: ["agenda", eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/content/event/${eventId}/agenda`);
      return res.data.data as AgendaItem[];
    },
    enabled: !!eventId,
  });

  const faqsQuery = useQuery({
    queryKey: ["faqs", eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/content/event/${eventId}/faqs`);
      return res.data.data as Faq[];
    },
    enabled: !!eventId,
  });

  const sponsorsQuery = useQuery({
    queryKey: ["sponsors", eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/content/event/${eventId}/sponsors`);
      return res.data.data as Sponsor[];
    },
    enabled: !!eventId,
  });

  const galleryQuery = useQuery({
    queryKey: ["gallery", eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/content/event/${eventId}/gallery`);
      return res.data.data as GalleryImage[];
    },
    enabled: !!eventId,
  });

  const gatesQuery = useQuery({
    queryKey: ["gates", eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/content/event/${eventId}/gates`);
      return res.data.data as Gate[];
    },
    enabled: !!eventId,
  });

  const ticketTypesQuery = useQuery({
    queryKey: ["ticket-types", eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/content/event/${eventId}/ticket-types`);
      return res.data.data as TicketType[];
    },
    enabled: !!eventId,
  });

  // ========== TABS ==========
  const tabs: Tab[] = useMemo(
    () => [
      {
        id: "speakers",
        label: t("content.tabs.speakers"),
        icon: <Mic size={14} strokeWidth={1.75} />,
        count: speakersQuery.data?.length,
      },
      {
        id: "agenda",
        label: t("content.tabs.agenda"),
        icon: <Calendar size={14} strokeWidth={1.75} />,
        count: agendaQuery.data?.length,
      },
      {
        id: "faqs",
        label: t("content.tabs.faqs"),
        icon: <HelpCircle size={14} strokeWidth={1.75} />,
        count: faqsQuery.data?.length,
      },
      {
        id: "sponsors",
        label: t("content.tabs.sponsors"),
        icon: <Handshake size={14} strokeWidth={1.75} />,
        count: sponsorsQuery.data?.length,
      },
      {
        id: "gallery",
        label: t("content.tabs.gallery"),
        icon: <Camera size={14} strokeWidth={1.75} />,
        count: galleryQuery.data?.length,
      },
      {
        id: "gates",
        label: t("content.tabs.gates"),
        icon: <DoorOpen size={14} strokeWidth={1.75} />,
        count: gatesQuery.data?.length,
      },
      {
        id: "ticketTypes",
        label: t("content.tabs.ticketTypes"),
        icon: <Ticket size={14} strokeWidth={1.75} />,
        count: ticketTypesQuery.data?.length,
      },
    ],
    [
      t,
      speakersQuery.data,
      agendaQuery.data,
      faqsQuery.data,
      sponsorsQuery.data,
      galleryQuery.data,
      gatesQuery.data,
      ticketTypesQuery.data,
    ],
  );

  if (!eventId) {
    return (
      <div className="container-page py-12">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      {/* Header */}
      <header className="mb-8">
        <button
          onClick={() => navigate(`/organizer/events/${eventId}`)}
          className="inline-flex items-center gap-2 text-body-sm text-ink-600 hover:text-ink-900 transition-colors mb-4"
        >
          <ArrowRight
            className="w-4 h-4 rtl:rotate-0 ltr:rotate-180"
            strokeWidth={1.75}
          />
          <span>{t("content.backToDetails")}</span>
        </button>

        <p className="label-overline mb-2">{t("content.label")}</p>
        <h1 className="heading-h1">{t("content.title")}</h1>
        <p className="mt-1.5 text-body-sm text-ink-600">
          {t("content.subtitle")}
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "speakers" && (
          <SpeakersTab
            eventId={eventId}
            data={speakersQuery.data || []}
            isLoading={speakersQuery.isLoading}
          />
        )}
        {activeTab === "agenda" && (
          <AgendaTab
            eventId={eventId}
            data={agendaQuery.data || []}
            speakers={speakersQuery.data || []}
            isLoading={agendaQuery.isLoading}
          />
        )}
        {activeTab === "faqs" && (
          <FaqsTab
            eventId={eventId}
            data={faqsQuery.data || []}
            isLoading={faqsQuery.isLoading}
          />
        )}
        {activeTab === "sponsors" && (
          <SponsorsTab
            eventId={eventId}
            data={sponsorsQuery.data || []}
            isLoading={sponsorsQuery.isLoading}
          />
        )}
        {activeTab === "gallery" && (
          <GalleryTab
            eventId={eventId}
            data={galleryQuery.data || []}
            isLoading={galleryQuery.isLoading}
          />
        )}
        {activeTab === "gates" && (
          <GatesTab
            eventId={eventId}
            data={gatesQuery.data || []}
            isLoading={gatesQuery.isLoading}
          />
        )}
        {activeTab === "ticketTypes" && (
          <TicketTypesTab
            eventId={eventId}
            data={ticketTypesQuery.data || []}
            isLoading={ticketTypesQuery.isLoading}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// SPEAKERS TAB
// ============================================
function SpeakersTab({
  eventId,
  data,
  isLoading,
}: {
  eventId: string;
  data: Speaker[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    title: "",
    bio: "",
    imageUrl: "",
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      title: string | null;
      bio: string | null;
      imageUrl: string | null;
    }) => apiClient.post(`/content/event/${eventId}/speakers`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakers", eventId] });
      setForm({ name: "", title: "", bio: "", imageUrl: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/content/speakers/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["speakers", eventId] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: form.name,
      title: form.title || null,
      bio: form.bio || null,
      imageUrl: form.imageUrl || null,
    });
  };

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t("speakers.addTitle")}
          description={t("speakers.addSubtitle")}
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("speakers.name")}
              placeholder={t("speakers.namePlaceholder")}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label={t("speakers.jobTitle")}
              placeholder={t("speakers.jobTitlePlaceholder")}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <Textarea
            label={t("speakers.bio")}
            placeholder={t("speakers.bioPlaceholder")}
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <Input
            label={t("speakers.imageUrl")}
            type="url"
            placeholder={t("speakers.imageUrlPlaceholder")}
            dir="ltr"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          <Button
            type="submit"
            variant="accent"
            loading={createMutation.isPending}
            leftIcon={<Plus size={16} strokeWidth={2} />}
          >
            {t("speakers.submit")}
          </Button>
        </form>
      </Card>

      <Card padding="none">
        <div className="px-6 py-5 border-b border-ink-200">
          <CardHeader
            title={t("speakers.currentTitle")}
            description={t("speakers.count", { count: data.length })}
          />
        </div>
        {isLoading ? (
          <div className="p-8">
            <PageLoader />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={Mic}
            title={t("speakers.noSpeakers")}
            description={t("speakers.noSpeakersDescription")}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.map((speaker) => (
              <li key={speaker.id} className="p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {speaker.imageUrl ? (
                    <img
                      src={speaker.imageUrl}
                      alt={speaker.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-h4 font-semibold text-gold-600">
                      {speaker.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-h4 font-semibold text-ink-900">
                    {speaker.name}
                  </h4>
                  {speaker.title && (
                    <p className="text-body-sm text-gold-600 font-medium mt-0.5">
                      {speaker.title}
                    </p>
                  )}
                  {speaker.bio && (
                    <p className="text-body-sm text-ink-600 mt-1 line-clamp-2">
                      {speaker.bio}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(t("speakers.confirmDelete"))) {
                      deleteMutation.mutate(speaker.id);
                    }
                  }}
                  className="!text-danger-600 hover:!bg-danger-100"
                  leftIcon={<Trash2 size={14} strokeWidth={1.75} />}
                >
                  {t("common.delete")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ============================================
// AGENDA TAB
// ============================================
function AgendaTab({
  eventId,
  data,
  speakers,
  isLoading,
}: {
  eventId: string;
  data: AgendaItem[];
  speakers: Speaker[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    time: "",
    title: "",
    description: "",
    speakerId: "",
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      time: string;
      title: string;
      description: string | null;
      speakerId: string | null;
    }) => apiClient.post(`/content/event/${eventId}/agenda`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda", eventId] });
      setForm({ time: "", title: "", description: "", speakerId: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/content/agenda/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["agenda", eventId] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      time: form.time,
      title: form.title,
      description: form.description || null,
      speakerId: form.speakerId || null,
    });
  };

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t("agenda.addTitle")}
          description={t("agenda.addSubtitle")}
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={t("agenda.time")}
              placeholder={t("agenda.timePlaceholder")}
              required
              dir="ltr"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
            <Input
              label={t("agenda.title")}
              placeholder={t("agenda.titlePlaceholder")}
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <div>
              <label className="block text-body-sm font-medium text-ink-900 mb-1.5">
                {t("agenda.speaker")}
              </label>
              <select
                value={form.speakerId}
                onChange={(e) =>
                  setForm({ ...form, speakerId: e.target.value })
                }
                className="w-full h-10 px-3 rounded-md border border-ink-200 bg-white text-body focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900/10"
              >
                <option value="">{t("agenda.noSpeaker")}</option>
                {speakers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Textarea
            label={t("agenda.description")}
            placeholder={t("agenda.descriptionPlaceholder")}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Button
            type="submit"
            variant="accent"
            loading={createMutation.isPending}
            leftIcon={<Plus size={16} strokeWidth={2} />}
          >
            {t("agenda.submit")}
          </Button>
        </form>
      </Card>

      <Card padding="none">
        <div className="px-6 py-5 border-b border-ink-200">
          <CardHeader
            title={t("agenda.currentTitle")}
            description={t("agenda.count", { count: data.length })}
          />
        </div>
        {isLoading ? (
          <div className="p-8">
            <PageLoader />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={t("agenda.noItems")}
            description={t("agenda.noItemsDescription")}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.map((item) => (
              <li key={item.id} className="p-5 flex items-start gap-4">
                <div className="flex-shrink-0">
                  <span className="inline-block text-caption font-semibold tabular-nums text-gold-600 bg-gold-100/50 px-2.5 py-1 rounded-sm">
                    {item.time}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-h4 font-semibold text-ink-900">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-body-sm text-ink-600 mt-1">
                      {item.description}
                    </p>
                  )}
                  {item.speaker && (
                    <p className="text-caption text-ink-500 mt-1.5">
                      {t("agenda.speakerLabel")}: {item.speaker.name}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(t("agenda.confirmDelete"))) {
                      deleteMutation.mutate(item.id);
                    }
                  }}
                  className="!text-danger-600 hover:!bg-danger-100"
                  leftIcon={<Trash2 size={14} strokeWidth={1.75} />}
                >
                  {t("common.delete")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ============================================
// FAQS TAB
// ============================================
function FaqsTab({
  eventId,
  data,
  isLoading,
}: {
  eventId: string;
  data: Faq[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ question: "", answer: "" });

  const createMutation = useMutation({
    mutationFn: (payload: { question: string; answer: string }) =>
      apiClient.post(`/content/event/${eventId}/faqs`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs", eventId] });
      setForm({ question: "", answer: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/content/faqs/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["faqs", eventId] }),
  });

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t("faqs.addTitle")}
          description={t("faqs.addSubtitle")}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <Input
            label={t("faqs.question")}
            placeholder={t("faqs.questionPlaceholder")}
            required
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
          />
          <Textarea
            label={t("faqs.answer")}
            placeholder={t("faqs.answerPlaceholder")}
            rows={3}
            required
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
          />
          <Button
            type="submit"
            variant="accent"
            loading={createMutation.isPending}
            leftIcon={<Plus size={16} strokeWidth={2} />}
          >
            {t("faqs.submit")}
          </Button>
        </form>
      </Card>

      <Card padding="none">
        <div className="px-6 py-5 border-b border-ink-200">
          <CardHeader
            title={t("faqs.currentTitle")}
            description={t("faqs.count", { count: data.length })}
          />
        </div>
        {isLoading ? (
          <div className="p-8">
            <PageLoader />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title={t("faqs.noFaqs")}
            description={t("faqs.noFaqsDescription")}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.map((item) => (
              <li key={item.id} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-h4 font-semibold text-ink-900">
                      {item.question}
                    </h4>
                    <p className="text-body-sm text-ink-600 mt-1.5 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(t("faqs.confirmDelete"))) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    className="!text-danger-600 hover:!bg-danger-100"
                    leftIcon={<Trash2 size={14} strokeWidth={1.75} />}
                  >
                    {t("common.delete")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ============================================
// SPONSORS TAB
// ============================================
function SponsorsTab({
  eventId,
  data,
  isLoading,
}: {
  eventId: string;
  data: Sponsor[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    logoUrl: "",
    websiteUrl: "",
    tier: "",
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      logoUrl: string | null;
      websiteUrl: string | null;
      tier: string | null;
    }) => apiClient.post(`/content/event/${eventId}/sponsors`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors", eventId] });
      setForm({ name: "", logoUrl: "", websiteUrl: "", tier: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/content/sponsors/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sponsors", eventId] }),
  });

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t("sponsors.addTitle")}
          description={t("sponsors.addSubtitle")}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              name: form.name,
              logoUrl: form.logoUrl || null,
              websiteUrl: form.websiteUrl || null,
              tier: form.tier || null,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("sponsors.name")}
              placeholder={t("sponsors.namePlaceholder")}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div>
              <label className="block text-body-sm font-medium text-ink-900 mb-1.5">
                {t("sponsors.tier")}
              </label>
              <select
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-ink-200 bg-white text-body focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900/10"
              >
                <option value="">{t("sponsors.tierNone")}</option>
                <option value="platinum">{t("sponsors.tiers.platinum")}</option>
                <option value="gold">{t("sponsors.tiers.gold")}</option>
                <option value="silver">{t("sponsors.tiers.silver")}</option>
                <option value="bronze">{t("sponsors.tiers.bronze")}</option>
                <option value="partner">{t("sponsors.tiers.partner")}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("sponsors.logoUrl")}
              type="url"
              placeholder="https://..."
              dir="ltr"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            />
            <Input
              label={t("sponsors.websiteUrl")}
              type="url"
              placeholder="https://example.com"
              dir="ltr"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
            />
          </div>
          <Button
            type="submit"
            variant="accent"
            loading={createMutation.isPending}
            leftIcon={<Plus size={16} strokeWidth={2} />}
          >
            {t("sponsors.submit")}
          </Button>
        </form>
      </Card>

      <Card padding="none">
        <div className="px-6 py-5 border-b border-ink-200">
          <CardHeader
            title={t("sponsors.currentTitle")}
            description={t("sponsors.count", { count: data.length })}
          />
        </div>
        {isLoading ? (
          <div className="p-8">
            <PageLoader />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title={t("sponsors.noSponsors")}
            description={t("sponsors.noSponsorsDescription")}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.map((sponsor) => (
              <li key={sponsor.id} className="p-5 flex items-center gap-4">
                <div className="w-16 h-16 bg-ink-50 border border-ink-200 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {sponsor.logoUrl ? (
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="max-w-[80%] max-h-[80%] object-contain"
                    />
                  ) : (
                    <Award className="w-5 h-5 text-ink-400" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-h4 font-semibold text-ink-900">
                    {sponsor.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    {sponsor.tier && (
                      <Badge variant="accent" size="sm">
                        {t(`sponsors.tiers.${sponsor.tier}`)}
                      </Badge>
                    )}
                    {sponsor.websiteUrl && (
                      <a
                        href={sponsor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-caption text-ink-500 hover:text-ink-900"
                      >
                        <ExternalLink size={11} strokeWidth={1.75} />
                        {t("sponsors.website")}
                      </a>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(t("sponsors.confirmDelete"))) {
                      deleteMutation.mutate(sponsor.id);
                    }
                  }}
                  className="!text-danger-600 hover:!bg-danger-100"
                  leftIcon={<Trash2 size={14} strokeWidth={1.75} />}
                >
                  {t("common.delete")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ============================================
// GALLERY TAB
// ============================================
function GalleryTab({
  eventId,
  data,
  isLoading,
}: {
  eventId: string;
  data: GalleryImage[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ imageUrl: "", caption: "" });

  const createMutation = useMutation({
    mutationFn: (payload: { imageUrl: string; caption: string | null }) =>
      apiClient.post(`/content/event/${eventId}/gallery`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery", eventId] });
      setForm({ imageUrl: "", caption: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/content/gallery/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["gallery", eventId] }),
  });

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t("gallery.addTitle")}
          description={t("gallery.addSubtitle")}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              imageUrl: form.imageUrl,
              caption: form.caption || null,
            });
          }}
          className="space-y-4"
        >
          <Input
            label={t("gallery.imageUrl")}
            type="url"
            placeholder={t("gallery.imageUrlPlaceholder")}
            required
            dir="ltr"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          <Input
            label={t("gallery.caption")}
            placeholder={t("gallery.captionPlaceholder")}
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
          />
          <Button
            type="submit"
            variant="accent"
            loading={createMutation.isPending}
            leftIcon={<Plus size={16} strokeWidth={2} />}
          >
            {t("gallery.submit")}
          </Button>
        </form>
      </Card>

      <Card padding="lg">
        <CardHeader
          title={t("gallery.currentTitle")}
          description={t("gallery.count", { count: data.length })}
        />
        {isLoading ? (
          <PageLoader />
        ) : data.length === 0 ? (
          <EmptyState
            icon={Camera}
            title={t("gallery.noImages")}
            description={t("gallery.noImagesDescription")}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {data.map((image) => (
              <div
                key={image.id}
                className="relative aspect-square rounded-lg overflow-hidden border border-ink-200 group"
              >
                <img
                  src={image.imageUrl}
                  alt={image.caption || ""}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    if (window.confirm(t("gallery.confirmDelete"))) {
                      deleteMutation.mutate(image.id);
                    }
                  }}
                  className="absolute top-2 end-2 w-7 h-7 bg-danger-500 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={t("common.delete")}
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
                {image.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-2">
                    <p className="text-caption text-white line-clamp-1">
                      {image.caption}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================
// GATES TAB
// ============================================
function GatesTab({
  eventId,
  data,
  isLoading,
}: {
  eventId: string;
  data: Gate[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", location: "" });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; location: string | null }) =>
      apiClient.post(`/content/event/${eventId}/gates`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gates", eventId] });
      setForm({ name: "", location: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.put(`/content/gates/${id}`, { isActive }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["gates", eventId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/content/gates/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["gates", eventId] }),
  });

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t("gates.addTitle")}
          description={t("gates.addSubtitle")}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              name: form.name,
              location: form.location || null,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("gates.name")}
              placeholder={t("gates.namePlaceholder")}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label={t("gates.location")}
              placeholder={t("gates.locationPlaceholder")}
              leftIcon={<MapPin size={16} strokeWidth={1.75} />}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <Button
            type="submit"
            variant="accent"
            loading={createMutation.isPending}
            leftIcon={<Plus size={16} strokeWidth={2} />}
          >
            {t("gates.submit")}
          </Button>
        </form>
      </Card>

      <Card padding="none">
        <div className="px-6 py-5 border-b border-ink-200">
          <CardHeader
            title={t("gates.currentTitle")}
            description={t("gates.count", { count: data.length })}
          />
        </div>
        {isLoading ? (
          <div className="p-8">
            <PageLoader />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title={t("gates.noGates")}
            description={t("gates.noGatesDescription")}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.map((gate) => (
              <li key={gate.id} className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-md bg-gold-100 flex items-center justify-center flex-shrink-0">
                  <DoorOpen
                    className="w-4 h-4 text-gold-600"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-h4 font-semibold text-ink-900">
                      {gate.name}
                    </h4>
                    {gate.isActive ? (
                      <Badge variant="success" size="sm" dot>
                        {t("gates.active")}
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm">
                        {t("gates.inactive")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {gate.location && (
                      <span className="text-caption text-ink-500">
                        {gate.location}
                      </span>
                    )}
                    <span className="text-caption text-ink-500 tabular-nums">
                      {t("gates.checkInsCount", {
                        count: gate._count?.checkIns || 0,
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        id: gate.id,
                        isActive: !gate.isActive,
                      })
                    }
                  >
                    {gate.isActive
                      ? t("gates.deactivate")
                      : t("gates.activate")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(t("gates.confirmDelete"))) {
                        deleteMutation.mutate(gate.id);
                      }
                    }}
                    className="!text-danger-600 hover:!bg-danger-100"
                    leftIcon={<Trash2 size={14} strokeWidth={1.75} />}
                  >
                    {t("common.delete")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ============================================
// TICKET TYPES TAB
// ============================================
function TicketTypesTab({
  eventId,
  data,
  isLoading,
}: {
  eventId: string;
  data: TicketType[];
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "#B08D57",
    capacity: "",
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      description: string | null;
      color: string;
      capacity: number | null;
    }) => apiClient.post(`/content/event/${eventId}/ticket-types`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-types", eventId] });
      setForm({ name: "", description: "", color: "#B08D57", capacity: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/content/ticket-types/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["ticket-types", eventId] }),
  });

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t("ticketTypes.addTitle")}
          description={t("ticketTypes.addSubtitle")}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              name: form.name,
              description: form.description || null,
              color: form.color,
              capacity: form.capacity ? Number(form.capacity) : null,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={t("ticketTypes.name")}
              placeholder={t("ticketTypes.namePlaceholder")}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label={t("ticketTypes.capacity")}
              type="number"
              placeholder={t("ticketTypes.capacityPlaceholder")}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
            <div>
              <label className="block text-body-sm font-medium text-ink-900 mb-1.5">
                {t("ticketTypes.color")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-12 h-10 rounded-md border border-ink-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="flex-1 h-10 px-3 rounded-md border border-ink-200 text-body font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
          <Textarea
            label={t("ticketTypes.description")}
            placeholder={t("ticketTypes.descriptionPlaceholder")}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Button
            type="submit"
            variant="accent"
            loading={createMutation.isPending}
            leftIcon={<Plus size={16} strokeWidth={2} />}
          >
            {t("ticketTypes.submit")}
          </Button>
        </form>
      </Card>

      <Card padding="none">
        <div className="px-6 py-5 border-b border-ink-200">
          <CardHeader
            title={t("ticketTypes.currentTitle")}
            description={t("ticketTypes.count", { count: data.length })}
          />
        </div>
        {isLoading ? (
          <div className="p-8">
            <PageLoader />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title={t("ticketTypes.noTypes")}
            description={t("ticketTypes.noTypesDescription")}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.map((tt) => (
              <li key={tt.id} className="p-5 flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 border"
                  style={{
                    backgroundColor: `${tt.color || "#B08D57"}20`,
                    borderColor: `${tt.color || "#B08D57"}40`,
                  }}
                >
                  <Ticket
                    size={16}
                    strokeWidth={1.75}
                    style={{ color: tt.color || "#B08D57" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-h4 font-semibold text-ink-900">
                      {tt.name}
                    </h4>
                    {tt.capacity && (
                      <Badge variant="default" size="sm">
                        {tt._count?.registrations || 0} / {tt.capacity}
                      </Badge>
                    )}
                  </div>
                  {tt.description && (
                    <p className="text-body-sm text-ink-600 mt-1 line-clamp-1">
                      {tt.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(t("ticketTypes.confirmDelete"))) {
                      deleteMutation.mutate(tt.id);
                    }
                  }}
                  className="!text-danger-600 hover:!bg-danger-100"
                  leftIcon={<Trash2 size={14} strokeWidth={1.75} />}
                >
                  {t("common.delete")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
