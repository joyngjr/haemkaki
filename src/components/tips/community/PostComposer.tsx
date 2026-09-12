import { useState } from "react";

import type { Group } from "@/lib/community-store";

/**
 * The "What's on your mind?" box. Collapsed to a single button until tapped, so
 * the feed stays the focus.
 */
export function PostComposer({
  groups,
  onSubmit,
}: {
  groups: Group[];
  onSubmit: (groupId: string, title: string, content: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");

  function submit() {
    if (!title.trim() || !content.trim() || !groupId) return;
    onSubmit(groupId, title.trim(), content.trim());
    setTitle("");
    setContent("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-[20px] bg-gray-100 px-4 py-3 text-left text-sm text-gray-500"
      >
        What's on your mind?
      </button>
    );
  }

  return (
    <div className="rounded-[20px] bg-gray-100 p-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your experience..."
        rows={3}
        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <select
        value={groupId}
        onChange={(e) => setGroupId(e.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2 text-xs font-semibold text-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          className="rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white"
        >
          Post
        </button>
      </div>
    </div>
  );
}
