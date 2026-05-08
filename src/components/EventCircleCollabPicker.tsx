import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Clock, X } from "lucide-react";
import { getCircles, getMyEditableCircles } from "@/data/backend";
import type { Circle } from "@/data/mock";

type Props = {
  myCircleIds: string[];
  invitedCircleIds: string[];
  onMyCircleIdsChange: (ids: string[]) => void;
  onInvitedCircleIdsChange: (ids: string[]) => void;
  userId: string;
  pendingCircleIds?: string[];
  declinedCircleIds?: string[];
};

function unique(ids: string[]) {
  return [...new Set(ids)];
}

function CircleSelect({
  label,
  placeholder,
  circles,
  value,
  onChange,
  pendingIds = [],
}: {
  label: string;
  placeholder: string;
  circles: Circle[];
  value: string[];
  onChange: (ids: string[]) => void;
  pendingIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = circles.filter((circle) => value.includes(circle.id));
  const unselected = circles.filter((circle) => !value.includes(circle.id));

  function add(id: string) {
    onChange(unique([...value, id]));
  }

  function remove(id: string) {
    onChange(value.filter((existing) => existing !== id));
  }

  return (
    <div ref={ref} className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div
        className="min-h-[2.5rem] w-full rounded-md border border-input bg-background px-3 py-1.5 flex flex-wrap gap-1.5 items-center cursor-pointer"
        onClick={() => setOpen((current) => !current)}
      >
        {selected.length === 0 && (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
        {selected.map((circle) => (
          <span
            key={circle.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
          >
            {circle.emoji} {circle.name}
            {pendingIds.includes(circle.id) && <Clock className="h-3 w-3" />}
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); remove(circle.id); }}
              className="hover:text-destructive transition-colors"
              aria-label={`Remove ${circle.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
      </div>

      {open && (
        <div className="relative">
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-64 overflow-y-auto">
            {unselected.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No more circles to add</p>
            ) : (
              unselected.map((circle) => (
                <button
                  key={circle.id}
                  type="button"
                  onClick={() => add(circle.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left transition-colors"
                >
                  <span>{circle.emoji}</span>
                  <span className="font-medium truncate">{circle.name}</span>
                  <span className="text-muted-foreground text-xs ml-auto shrink-0">{circle.category}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventCircleCollabPicker({
  myCircleIds,
  invitedCircleIds,
  onMyCircleIdsChange,
  onInvitedCircleIdsChange,
  userId,
  pendingCircleIds = [],
  declinedCircleIds = [],
}: Props) {
  const [myCircles, setMyCircles] = useState<Circle[]>([]);
  const [allCircles, setAllCircles] = useState<Circle[]>([]);

  useEffect(() => {
    Promise.all([getMyEditableCircles(userId), getCircles()])
      .then(([editable, all]) => {
        setMyCircles(editable);
        setAllCircles(all);
      })
      .catch(() => {});
  }, [userId]);

  const myIds = useMemo(() => new Set(myCircles.map((circle) => circle.id)), [myCircles]);
  const otherCircles = allCircles.filter((circle) => !myIds.has(circle.id));

  if (myCircles.length === 0 && otherCircles.length === 0) {
    return <p className="text-sm text-muted-foreground py-1">No circles available yet.</p>;
  }

  return (
    <div className="space-y-3">
      {myCircles.length > 0 ? (
        <CircleSelect
          label="Add my circle"
          placeholder="Select circles you own or manage..."
          circles={myCircles}
          value={myCircleIds}
          onChange={onMyCircleIdsChange}
        />
      ) : (
        <p className="text-sm text-muted-foreground py-1">You don't own or manage any circles yet.</p>
      )}

      {otherCircles.length > 0 && (
        <CircleSelect
          label="Invite collaborating circle"
          placeholder="Request another circle..."
          circles={otherCircles}
          value={invitedCircleIds}
          onChange={onInvitedCircleIdsChange}
          pendingIds={pendingCircleIds}
        />
      )}

      {(pendingCircleIds.length > 0 || declinedCircleIds.length > 0) && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Current requests</p>
          <div className="flex flex-wrap gap-1.5">
            {pendingCircleIds.map((id) => {
              const circle = allCircles.find((c) => c.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  <Clock className="h-3 w-3" /> {circle?.emoji} {circle?.name ?? id} · Pending
                </span>
              );
            })}
            {declinedCircleIds.map((id) => {
              const circle = allCircles.find((c) => c.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                  {circle?.emoji} {circle?.name ?? id} · Declined
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
