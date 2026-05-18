import toast from "react-hot-toast";
import React, { useState } from "react";
import {
  SectionHeader,
  SoftBrutalCard,
  StatusBadge,
  ActionButton,
} from "@/components/ui/Primitives";
import { useStore } from "@/store/useStore";
import { Plus, X, Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";
import { Card, ActionCard } from "@/components/ui/Cards";
import { Event as AppEvent } from "@/types";
import { useLocale } from "@/lib/locale";

function AddEventModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (e: AppEvent) => void;
}) {
  const { text } = useLocale();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const imageFile = formData.get("image") as File;
    
    const finalizeAdd = (imageUrl?: string) => {
      onAdd({
        id: Math.random().toString(),
        title: formData.get("title") as string,
        date: formData.get("date") as string,
        time: formData.get("time") as string,
        location: formData.get("location") as string,
        luma_link: formData.get("luma_link") as string,
        description: formData.get("description") as string,
        type: "Workshop",
        attendees: 0,
        image: imageUrl,
      });
      onClose();
    };

    if (imageFile && imageFile.size > 0) {
      const reader = new FileReader();
      reader.onloadend = () => {
        finalizeAdd(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else {
      finalizeAdd(undefined);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={text("Add Event", "Thêm sự kiện")}
      label={text("SCHEDULER", "LỊCH ĐIỀU PHỐI")}
      footer={
        <div className="w-full flex items-center justify-end">
          <ActionButton
            type="submit"
            form="add-event-form"
            variant="primary"
          >
            {text("Create Event", "Tạo sự kiện")}
          </ActionButton>
        </div>
      }
    >
      <form id="add-event-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            {text("Event Title", "Tên sự kiện")}
          </label>
          <input
            name="title"
            required
            className="w-full border border-border-main bg-surface p-3 text-sm focus:border-primary outline-none transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            {text("Cover Image (Optional)", "Ảnh bìa (không bắt buộc)")}
          </label>
          <input
            name="image"
            type="file"
            accept="image/*"
            className="w-full border border-border-main bg-surface p-2 text-sm focus:border-primary outline-none transition-colors file:mr-4 file:py-1 file:px-3 file:border-2 file:border-text-main file:bg-highlight file:text-text-main file:font-mono file:text-xs file:font-bold hover:file:bg-text-main hover:file:text-surface file:transition-colors file:shadow-[2px_2px_0_0_#000] dark:file:shadow-[2px_2px_0_0_#fff] cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
              {text("Date", "Ngày")}
            </label>
            <input
              name="date"
              type="date"
              required
              className="w-full border border-border-main bg-surface p-3 text-sm focus:border-primary outline-none transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
              {text("Time", "Giờ")}
            </label>
            <input
              name="time"
              type="time"
              required
              className="w-full border border-border-main bg-surface p-3 text-sm focus:border-primary outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            {text("Location", "Địa điểm")}
          </label>
          <input
            name="location"
            required
            className="w-full border border-border-main bg-surface p-3 text-sm focus:border-primary outline-none transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            {text("Description", "Mô tả")}
          </label>
          <textarea
            name="description"
            className="w-full border border-border-main bg-surface p-3 text-sm focus:border-primary outline-none min-h-[80px] resize-none transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted">
            {text("LuMa Link", "Link LuMa")}
          </label>
          <input
            name="luma_link"
            type="url"
            required
            className="w-full border border-border-main bg-surface p-3 text-sm focus:border-primary outline-none transition-colors"
          />
        </div>
      </form>
    </ModalShell>
  );
}

export function Events() {
  const { text, isVIE } = useLocale();
  const { events, addEvent, currentUser } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const canManage = currentUser?.memberType === "member";

  const now = new Date();

  const getEventTimestamp = (event: AppEvent) => {
    const safeDate = event.date || new Date().toISOString().slice(0, 10);
    const safeTime = event.time?.trim() ? event.time.trim() : "23:59";
    const timestamp = new Date(`${safeDate}T${safeTime}`);
    return Number.isNaN(timestamp.getTime())
      ? new Date(safeDate).getTime()
      : timestamp.getTime();
  };

  const sortedEvents = [...events].sort((a, b) => {
    const aTime = getEventTimestamp(a);
    const bTime = getEventTimestamp(b);
    const aUpcoming = aTime >= now.getTime();
    const bUpcoming = bTime >= now.getTime();

    if (filter === "past") {
      return bTime - aTime;
    }

    if (filter === "upcoming") {
      return aTime - bTime;
    }

    if (aUpcoming !== bUpcoming) {
      return aUpcoming ? -1 : 1;
    }

    return aUpcoming ? aTime - bTime : bTime - aTime;
  });
  const filteredEvents = sortedEvents.filter((evt) => {
    const evtTime = getEventTimestamp(evt);
    if (filter === "upcoming") return evtTime >= now.getTime();
    if (filter === "past") return evtTime < now.getTime();
    return true;
  });

  const handleAddClick = () => {
    if (!currentUser) {
      toast.error(text("Please log in first!", "Vui lòng đăng nhập trước!"));
      return;
    }
    if (!canManage) {
      toast.error(
        text(
          "Community accounts cannot create events.",
          "Tài khoản community không thể tạo sự kiện.",
        ),
      );
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <SectionHeader
          title={text("Events & Sessions", "Sự kiện & buổi gặp")}
          subtitle={text(
            "Workshops, meetups, and builder co-working sessions.",
            "Workshop, meetup và các buổi co-working dành cho builder.",
          )}
          className="mb-0"
        />

        <div className="flex flex-col items-end gap-4 w-full md:w-auto">
          <div className="flex flex-wrap gap-2 justify-end font-mono text-[10px] uppercase font-bold">
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-3 py-1.5 border border-border-main transition-all ${filter === "upcoming" ? "bg-text-main text-surface" : "bg-surface text-text-muted hover:text-text-main hover:bg-main-bg shadow-sm"}`}
            >
              {text("Upcoming", "Sắp diễn ra")}
            </button>
            <button
              onClick={() => setFilter("past")}
              className={`px-3 py-1.5 border border-border-main transition-all ${filter === "past" ? "bg-text-main text-surface" : "bg-surface text-text-muted hover:text-text-main hover:bg-main-bg shadow-sm"}`}
            >
              {text("Past Recordings", "Đã diễn ra")}
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 border border-border-main transition-all ${filter === "all" ? "bg-text-main text-surface" : "bg-surface text-text-muted hover:text-text-main hover:bg-main-bg shadow-sm"}`}
            >
              {text("All", "Tất cả")}
            </button>
          </div>
          {canManage ? (
            <ActionButton
              variant="primary"
              className="w-full md:w-auto"
              onClick={handleAddClick}
            >
              <span className="flex items-center gap-2 justify-center">
                <Plus size={16} /> {text("Add Event", "Thêm sự kiện")}
              </span>
            </ActionButton>
          ) : (
            <div className="px-4 py-2 bg-main-bg border border-border-main text-xs font-mono text-text-muted text-center">
              {text("Events restricted to Members", "Chỉ member mới được quản lý sự kiện")}
            </div>
          )}
        </div>
      </div>

      {filter === "past" ? (
        <div className="space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((evt) => {
              const dateObj = evt.date ? new Date(evt.date) : new Date();
              const month = dateObj.toLocaleString(isVIE ? "vi-VN" : "en-US", {
                month: "short",
              });
              const day = String(dateObj.getDate()).padStart(2, "0");
              const lumaLink = String(
                (evt as any).luma_link ||
                  (evt as any).lumaLink ||
                  (evt as any).link ||
                  "",
              ).trim();
              
              return (
                <div 
                  key={evt.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-2 border-text-main bg-surface hover:bg-main-bg transition-colors ${lumaLink ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (lumaLink) window.open(lumaLink, "_blank", "noopener,noreferrer");
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-xs font-bold text-text-muted w-16 whitespace-nowrap">
                      {month} {day}
                    </div>
                    <div>
                      <h4 className="font-heading font-black uppercase text-text-main text-sm sm:text-base">
                        {evt.title}
                      </h4>
                      <div className="font-mono text-[10px] text-text-muted font-bold mt-1 uppercase">
                        {evt.type || text("Recording", "Bản ghi")} {evt.location ? `• ${evt.location}` : ""}
                      </div>
                    </div>
                  </div>
                  {lumaLink && (
                     <div className="flex sm:justify-start justify-end">
                       <span className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center gap-1 hover:underline">
                         {text("View", "Xem")} <ArrowRight size={12} />
                       </span>
                     </div>
                  )}
                </div>
              );
            })
          ) : (
            <Card className="p-12 text-center text-text-muted font-mono uppercase text-xs">
              <p>{text("No past recordings yet.", "Chưa có bản ghi nào.")}</p>
            </Card>
          )}
        </div>
      ) : (
        <div className="relative py-8 md:py-12 space-y-8 md:space-y-16">
          <div className="absolute left-[24px] md:left-1/2 top-0 bottom-0 w-[3px] bg-text-main -ml-[1.5px] z-0"></div>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((evt, idx) => {
              const dateObj = evt.date ? new Date(evt.date) : new Date();
              const month = dateObj.toLocaleString(isVIE ? "vi-VN" : "en-US", {
                month: "short",
              });
              const day = String(dateObj.getDate()).padStart(2, "0");
              const lumaLink = String(
                (evt as any).luma_link ||
                  (evt as any).lumaLink ||
                  (evt as any).link ||
                  "",
              ).trim();
              const isEven = idx % 2 === 0;
              
              return (
                <div 
                  key={evt.id} 
                  className={`relative w-full flex flex-col md:flex-row group ${lumaLink ? 'cursor-pointer' : ''} ${isEven ? 'md:justify-start' : 'md:justify-end'}`}
                  onClick={() => {
                    if (lumaLink) window.open(lumaLink, "_blank", "noopener,noreferrer");
                  }}
                >
                  {/* Timeline Node Marker */}
                  <div className="absolute left-[24px] md:left-1/2 top-8 md:top-1/2 w-5 h-5 bg-surface border-[4px] border-text-main -translate-x-1/2 md:-translate-y-1/2 group-hover:bg-primary group-hover:scale-125 transition-all z-10 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]" />
                  
                  {/* Compact Event Card */}
                  <div className={`w-[calc(100%-48px)] md:w-[calc(50%-48px)] ml-auto md:ml-0 flex flex-col bg-surface border-2 border-text-main shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] group-hover:shadow-[8px_8px_0_0_#000] dark:group-hover:shadow-[8px_8px_0_0_#fff] group-hover:-translate-y-1 group-hover:-translate-x-1 transition-all duration-300 p-0`}>
                    
                    {evt.image && (
                      <div className="w-full h-32 md:h-40 border-b-2 border-text-main overflow-hidden bg-highlight flex-shrink-0">
                         <img src={evt.image} alt={evt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 origin-center filter grayscale group-hover:grayscale-0" />
                      </div>
                    )}
                    
                    <div className="flex flex-row items-stretch w-full">
                      {/* Date Block */}
                      <div className="flex flex-col items-center justify-center p-4 bg-main-bg border-r-2 border-text-main w-20 md:w-24 group-hover:bg-primary group-hover:text-surface transition-colors flex-shrink-0">
                        <span className="font-heading font-black text-3xl leading-none">{day}</span>
                        <span className="font-mono text-[10px] uppercase font-bold tracking-widest mt-1 opacity-80">{month}</span>
                      </div>

                      {/* Content Block */}
                      <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-highlight text-text-main border border-text-main text-[9px] font-mono uppercase font-black tracking-widest">
                            {evt.type || "EVENT"}
                          </span>
                          {evt.time && (
                            <span className="font-mono text-[10px] font-bold text-text-muted flex items-center gap-1 group-hover:text-primary transition-colors">
                              <Clock size={10} /> {evt.time}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-heading font-black text-lg md:text-xl uppercase tracking-tight text-text-main line-clamp-1 mb-1">
                          {evt.title}
                        </h3>
                        
                        <div className="flex items-center gap-3 font-mono text-[10px] font-bold text-text-muted mt-2">
                           {evt.location && (
                              <span className="flex flex-1 items-center gap-1 truncate">
                                 <MapPin size={10} className="text-primary flex-shrink-0" /> <span className="truncate">{evt.location}</span>
                              </span>
                           )}
                        </div>
                      </div>

                      {/* Action Block */}
                      {lumaLink && (
                        <div className="hidden sm:flex items-center justify-center px-4 md:px-6 border-l-2 border-text-main bg-main-bg text-text-muted group-hover:bg-text-main group-hover:text-surface transition-colors flex-shrink-0">
                          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                      {lumaLink && (
                        <div className="sm:hidden flex items-center justify-center px-4 text-text-muted group-hover:text-primary transition-colors border-l-2 border-dashed border-border-main flex-shrink-0">
                          <ArrowRight size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <Card className="p-12 text-center text-text-muted font-mono uppercase text-xs">
              <p>{text("No events found for this category.", "Không có sự kiện nào trong mục này.")}</p>
            </Card>
          )}
        </div>
      )}

      <AddEventModal
        isOpen={isModalOpen && canManage}
        onClose={() => setIsModalOpen(false)}
        onAdd={addEvent}
      />
    </div>
  );
}
