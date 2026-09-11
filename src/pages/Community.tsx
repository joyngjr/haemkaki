import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCommunity, timeAgo, type Group } from "@/lib/community-store";

const GROUP_COLOR_CHOICES = [
  "#ec4899",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#0ea5e9",
  "#22c55e",
  "#ef4444",
];

function GroupIcon({ group, size = 40 }: { group: Group; size?: number }) {
  const initial = group.name.charAt(0).toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ background: group.color, width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

export function Community() {
  const { groups, posts, addGroup, addPost, deletePost, toggleLike, addComment } = useCommunity();

  const [activeTab, setActiveTab] = useState<"feed" | "groups">("feed");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPostGroupId, setNewPostGroupId] = useState(groups[0]?.id ?? "");

  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLOR_CHOICES[0]);

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const visiblePosts = selectedGroupId
    ? posts.filter((post) => post.groupId === selectedGroupId)
    : posts;

  function groupById(id: string): Group | undefined {
    return groups.find((group) => group.id === id);
  }

  function handleSubmitPost() {
    if (!newTitle.trim() || !newContent.trim() || !newPostGroupId) return;
    addPost(newPostGroupId, newTitle.trim(), newContent.trim());
    setNewTitle("");
    setNewContent("");
    setComposerOpen(false);
  }

  function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    addGroup(newGroupName.trim(), newGroupDescription.trim(), newGroupColor);
    setNewGroupName("");
    setNewGroupDescription("");
    setGroupFormOpen(false);
  }

  function handleSubmitComment(postId: string) {
    const draft = commentDrafts[postId];
    if (!draft || !draft.trim()) return;
    addComment(postId, draft.trim());
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
  }

  return (
    <div className="px-4 pt-8 pb-8">
      <Link
        to="/tips"
        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </Link>
      <PageHeader title="Community" subtitle="Real people. Real stories. A stronger community." />

      {/* Tabs */}
      <div className="mt-5 flex gap-6 border-b border-gray-200 text-sm font-semibold text-gray-500">
        <button
          onClick={() => setActiveTab("feed")}
          className={
            "pb-2 " + (activeTab === "feed" ? "border-b-2 border-blue-500 text-blue-600" : "")
          }
        >
          Feed
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={
            "pb-2 " + (activeTab === "groups" ? "border-b-2 border-blue-500 text-blue-600" : "")
          }
        >
          Groups
        </button>
      </div>

      {activeTab === "feed" && (
        <div className="mt-4">
          {/* Composer */}
          {!composerOpen ? (
            <button
              onClick={() => setComposerOpen(true)}
              className="w-full rounded-[20px] bg-gray-100 px-4 py-3 text-left text-sm text-gray-500"
            >
              What's on your mind?
            </button>
          ) : (
            <div className="rounded-[20px] bg-gray-100 p-4">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <select
                value={newPostGroupId}
                onChange={(e) => setNewPostGroupId(e.target.value)}
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
                  onClick={() => setComposerOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPost}
                  className="rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Popular topics (chips) */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGroupId(null)}
              className={
                "rounded-full px-3 py-1.5 text-xs font-semibold " +
                (selectedGroupId === null ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600")
              }
            >
              All
            </button>
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={
                  "rounded-full px-3 py-1.5 text-xs font-semibold " +
                  (selectedGroupId === group.id ? "text-white" : "text-gray-700")
                }
                style={{
                  background: selectedGroupId === group.id ? group.color : group.color + "22",
                }}
              >
                {group.name}
              </button>
            ))}
          </div>

          {/* Post list */}
          <div className="mt-4 flex flex-col gap-4">
            {visiblePosts.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">
                No posts yet in this topic. Be the first to share!
              </p>
            )}

            {visiblePosts.map((post) => {
              const group = groupById(post.groupId);
              const isExpanded = expandedPostId === post.id;
              return (
                <div key={post.id} className="rounded-[20px] bg-white p-4 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                        {post.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{post.author}</p>
                        <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
                      </div>
                    </div>

                    {post.author === "You" && (
                      <button
                        onClick={() => {
                          if (window.confirm("Delete this post?")) deletePost(post.id);
                        }}
                        className="text-gray-400"
                        aria-label="Delete post"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path
                            d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  <h3 className="mt-3 font-bold text-gray-900">{post.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{post.content}</p>

                  {group && (
                    <span
                      className="mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                      style={{ background: group.color }}
                    >
                      {group.name}
                    </span>
                  )}

                  <div className="mt-3 flex items-center gap-5 text-sm text-gray-500">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className="flex items-center gap-1.5"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill={post.likedByMe ? "#ef4444" : "none"}
                        stroke={post.likedByMe ? "#ef4444" : "currentColor"}
                        strokeWidth="1.8"
                      >
                        <path d="M12 21s-7-4.5-9.5-9C0.8 8.5 2 5 5.2 4.3c2-0.4 3.8 0.6 4.8 2.2 1-1.6 2.8-2.6 4.8-2.2C18 5 19.2 8.5 21.5 12c-2.5 4.5-9.5 9-9.5 9z" />
                      </svg>
                      {post.likes}
                    </button>

                    <button
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                      className="flex items-center gap-1.5"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5H4l3-3.5A8.38 8.38 0 0 1 4 8.5 8.38 8.38 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z" />
                      </svg>
                      {post.comments.length}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      {post.comments.length === 0 && (
                        <p className="text-xs text-gray-400">
                          No comments yet. Be the first to reply.
                        </p>
                      )}
                      <div className="flex flex-col gap-3">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="rounded-lg bg-gray-50 p-2.5">
                            <p className="text-xs font-semibold text-gray-800">{comment.author}</p>
                            <p className="mt-0.5 text-xs text-gray-600">{comment.content}</p>
                            <p className="mt-0.5 text-[10px] text-gray-400">
                              {timeAgo(comment.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 flex gap-2">
                        <input
                          value={commentDrafts[post.id] ?? ""}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          placeholder="Write a comment..."
                          className="flex-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs"
                        />
                        <button
                          onClick={() => handleSubmitComment(post.id)}
                          className="rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "groups" && (
        <div className="mt-4">
          {!groupFormOpen ? (
            <button
              onClick={() => setGroupFormOpen(true)}
              className="w-full rounded-[20px] border-2 border-dashed border-gray-300 py-3 text-sm font-semibold text-gray-500"
            >
              + Create a new group
            </button>
          ) : (
            <div className="rounded-[20px] bg-gray-100 p-4">
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="What's this group about?"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="mt-3 flex gap-2">
                {GROUP_COLOR_CHOICES.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewGroupColor(color)}
                    className="h-7 w-7 rounded-full"
                    style={{
                      background: color,
                      outline: newGroupColor === color ? "2px solid #111827" : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => setGroupFormOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col divide-y divide-gray-100 rounded-[20px] bg-white shadow-md">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedGroupId(group.id);
                  setActiveTab("feed");
                }}
                className="flex items-center gap-3 p-4 text-left"
              >
                <GroupIcon group={group} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{group.name}</p>
                  <p className="text-xs text-gray-500">
                    {group.memberCount.toLocaleString()} members
                  </p>
                </div>
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
