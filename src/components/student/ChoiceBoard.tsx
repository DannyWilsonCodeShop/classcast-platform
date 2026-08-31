'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Choice {
  choiceId: string;
  title: string;
  description: string;
  color: string;
  maxSlotsPerSection: number;
}

function renderChoiceMarkdown(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let inList = false;
  const closeList = () => { if (inList) { html.push('</ul>'); inList = false; } };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') { continue; } // drop blank lines so bullets sit close together
    const inline = (s: string) => s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

    if (line === '---') { closeList(); html.push('<hr class="my-2 border-stone-200">'); continue; }
    const h = line.match(/^##\s+(.+)$/);
    if (h) { closeList(); html.push(`<h4>${inline(h[1])}</h4>`); continue; }
    const li = line.match(/^[-*]\s+(.+)$/);
    if (li) { if (!inList) { html.push('<ul>'); inList = true; } html.push(`<li>${inline(li[1])}</li>`); continue; }
    closeList();
    html.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return html.join('');
}

interface ChoiceBoardProps {
  assignmentId: string;
  choices: Choice[];
  sectionId?: string;
  assignmentDescription?: string;
  assignmentTitle?: string;
  dueDate?: string;
  maxScore?: number;
}

export function ChoiceBoard({ assignmentId, choices, sectionId, assignmentDescription, assignmentTitle, dueDate, maxScore }: ChoiceBoardProps) {
  const router = useRouter();
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlots();
  }, [assignmentId, sectionId]);

  const fetchSlots = async () => {
    try {
      let url = `/api/assignments/${assignmentId}/choices`;
      if (sectionId) url += `?sectionId=${sectionId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setSlotCounts(data.slotCounts || {});
    } catch {} finally { setLoading(false); }
  };

  const handleChoiceSelect = (choiceId: string) => {
    let url = `/student/record?assignmentId=${assignmentId}&choiceId=${choiceId}`;
    if (sectionId) url += `&sectionId=${encodeURIComponent(sectionId)}`;
    router.push(url);
  };

  const isFull = (choice: Choice) => (slotCounts[choice.choiceId] || 0) >= choice.maxSlotsPerSection;
  const getSlotsRemaining = (choice: Choice) => Math.max(0, choice.maxSlotsPerSection - (slotCounts[choice.choiceId] || 0));

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-stone-900" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
          Choose Your Topic
        </h2>
        <p className="text-xs text-stone-500 mt-1">Pick one option below to record your video about</p>
      </div>

      {/* Choice Cards Grid */}
      <div className={`grid gap-4 ${choices.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
        {choices.map(choice => {
          const full = isFull(choice);
          const remaining = getSlotsRemaining(choice);
          const isFlipped = flippedCard === choice.choiceId;

          return (
            <div
              key={choice.choiceId}
              className="relative"
              style={{ perspective: '1000px' }}
            >
              <div
                className={`relative w-full transition-transform duration-500 min-h-[280px] sm:min-h-[440px] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* FRONT of card */}
                <div
                  className={`absolute inset-0 rounded-2xl p-5 flex flex-col justify-between cursor-pointer active:scale-[0.97] transition-transform ${full ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    backgroundColor: choice.color + '15',
                    borderColor: choice.color + '40',
                    borderWidth: '2px',
                    backfaceVisibility: 'hidden',
                  }}
                  onClick={() => !full && setFlippedCard(choice.choiceId)}
                >
                  {/* Color accent bar */}
                  <div className="w-10 h-1.5 rounded-full" style={{ backgroundColor: choice.color }} />

                  {/* Title only on the cover */}
                  <div className="flex-1 flex items-center justify-center text-center px-2">
                    <h3 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                      {choice.title}
                    </h3>
                  </div>

                  {/* Slot counter */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${full ? 'bg-red-100 text-red-700' : 'bg-white/80 text-stone-600'}`}>
                      {full ? 'Full' : `${remaining} spots left`}
                    </span>
                    {!full && (
                      <span className="text-[10px] text-stone-400">Tap to view →</span>
                    )}
                  </div>
                </div>

                {/* BACK of card (flipped) */}
                <div
                  className="absolute inset-0 rounded-2xl p-5 flex flex-col bg-white border-2"
                  style={{
                    borderColor: choice.color,
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {/* Back button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setFlippedCard(null); }}
                    className="text-xs text-stone-400 mb-2 self-start hover:text-stone-600"
                  >
                    ← Back to choices
                  </button>

                  {/* Choice title */}
                  <div className="w-8 h-1 rounded-full mb-2" style={{ backgroundColor: choice.color }} />
                  <h3 className="text-sm font-bold text-stone-900 mb-1">{choice.title}</h3>

                  {/* Choice-specific directions */}
                  {choice.description ? (
                    <div
                      className="flex-1 text-xs sm:text-[13px] text-stone-700 leading-relaxed mb-3 min-h-0 overflow-y-auto [&_p]:mb-1.5 [&_strong]:font-semibold [&_em]:italic [&_h4]:font-bold [&_h4]:text-stone-900 [&_h4]:mt-2 [&_h4]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-1 [&_li]:leading-snug"
                      dangerouslySetInnerHTML={{ __html: renderChoiceMarkdown(choice.description) }}
                    />
                  ) : (
                    <div className="flex-1 text-xs text-stone-400 italic leading-relaxed mb-3">
                      {assignmentDescription || 'No specific directions for this choice.'}
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="text-[10px] text-stone-400 space-y-0.5 mb-3">
                    {dueDate && <p>Due: {new Date(dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>}
                    {maxScore && <p>{maxScore} points</p>}
                  </div>

                  {/* Record button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleChoiceSelect(choice.choiceId); }}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white active:scale-[0.97] transition-transform"
                    style={{ backgroundColor: choice.color }}
                  >
                    Record Video
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <p className="text-center text-[10px] text-stone-400 mt-4">
        Slots are per section. When a choice is full, pick a different one.
      </p>
    </div>
  );
}
