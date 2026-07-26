'use client';

import { X } from "lucide-react";
import { Story } from "@/lib/zafiro-data";
import { AnimatePresence, motion } from "motion/react";

interface StoryViewerProps {
  story: Story | null;
  stories: Story[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function StoryViewer({
  story,
  stories,
  index,
  onClose,
  onNext,
  onPrev,
}: StoryViewerProps) {
  if (!story) return null;

  const isFirst = index === 0;
  const isLast = index === stories.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key={story.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/95 z-50 flex flex-col"
      >
        <div className="relative flex-1 flex flex-col">
          <img
            src={story.content.image}
            alt={story.content.title}
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex gap-1 px-4 pt-3">
              {stories.map((s, i) => (
                <div
                  key={s.id}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i <= index ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between px-4 pt-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${story.gradient} p-[2px]`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-black/40">
                    <img
                      src={story.avatar}
                      alt={story.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{story.name}</p>
                  <p className="text-xs text-white/60">{story.duration}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1" />

            <div className="px-6 pb-8 space-y-3">
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-white/80 border border-white/20">
                {story.content.tag}
              </span>
              <h3 className="text-xl font-bold text-white leading-tight">
                {story.content.title}
              </h3>
              <p className="text-sm text-white/70 leading-relaxed max-w-lg">
                {story.content.text}
              </p>
            </div>

            <div className="flex items-center justify-between px-4 pb-6">
              <button
                onClick={onPrev}
                disabled={isFirst}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  isFirst
                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Previous
              </button>
              <button
                onClick={onNext}
                disabled={isLast}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  isLast
                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
