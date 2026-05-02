"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import TagPicker from "@/components/TagPicker";
import { useAuth } from "@/components/AuthProvider";
import { deleteCircle, updateCircle } from "@/data/backend";
import { useRouter } from "@tanstack/react-router";

export default function OwnerCircleControls({ circle }: { circle: any }) {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(circle.tags ?? []);

  async function handleDelete() {
    await deleteCircle(circle.id);
    await router.navigate({ to: "/circles" });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateCircle(circle.id, {
        name: circle.name,
        category: circle.category,
        description: circle.description,
        activity: circle.activity,
        englishFriendly: circle.englishFriendly,
        commitment: circle.commitment,
        emoji: circle.emoji,
        iconUrl: circle.iconUrl,
        tags: selectedTags,
        socialLinks: circle.socialLinks ?? {},
      });
      await router.invalidate();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!user || (!isAdmin && user.id !== circle.owner_id)) return null;

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <TagPicker value={selectedTags} onChange={setSelectedTags} />
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </>
      ) : (
        <>
          <Button size="sm" onClick={() => setEditing(true)}>Edit</Button>
          <DeleteRecordButton label={circle.name} onDelete={handleDelete} />
        </>
      )}
    </div>
  );
}
