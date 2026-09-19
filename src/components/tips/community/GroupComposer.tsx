import { useState } from "react";

/** The palette a new group's initial bubble can be tinted with. */
const GROUP_COLOR_CHOICES = [
  "#ec4899",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#0ea5e9",
  "#22c55e",
  "#ef4444",
];

/** The "create a group" form, collapsed to a dashed button until tapped. */
export function GroupComposer({
  onSubmit,
}: {
  onSubmit: (name: string, description: string, color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(GROUP_COLOR_CHOICES[0]);

  function submit() {
    if (!name.trim()) return;
    onSubmit(name.trim(), description.trim(), color);
    setName("");
    setDescription("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-[20px] border-2 border-dashed border-gray-300 py-3 text-sm font-semibold text-gray-500"
      >
        + Create a new group
      </button>
    );
  }

  return (
    <div className="rounded-[20px] bg-gray-100 p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Group name"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What's this group about?"
        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="mt-3 flex gap-2">
        {GROUP_COLOR_CHOICES.map((choice) => (
          <button
            key={choice}
            onClick={() => setColor(choice)}
            className="h-7 w-7 rounded-full"
            style={{
              background: choice,
              outline: color === choice ? "2px solid #111827" : "none",
              outlineOffset: "2px",
            }}
          />
        ))}
      </div>
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
          Create
        </button>
      </div>
    </div>
  );
}
