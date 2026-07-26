'use client';

import { Compass } from "lucide-react";
import { Story } from "@/lib/zafiro-data";

interface StoriesBarProps {
  stories: Story[];
  onViewStory: (story: Story, index: number) => void;
}

export default function StoriesBar({ stories, onViewStory }: StoriesBarProps) {
  return (
    <section className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Compass className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Destellos de Sabiduría
        </h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {stories.map((story, index) => (
          <button
            key={story.id}
            onClick={() => onViewStory(story, index)}
            className="flex flex-col items-center gap-1.5 group flex-shrink-0"
          >
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-br ${story.gradient} p-[2px]`}
            >
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-black/40">
                <img
                  src={story.avatar}
                  alt={story.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-white transition-colors max-w-[72px] truncate">
              {story.name}
            </span>
            <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">
              {story.duration}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
