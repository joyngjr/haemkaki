import { useState } from "react";

import { GroupComposer } from "@/components/tips/community/GroupComposer";
import { GroupList } from "@/components/tips/community/GroupList";
import { PostCard } from "@/components/tips/community/PostCard";
import { PostComposer } from "@/components/tips/community/PostComposer";
import { TopicChips } from "@/components/tips/community/TopicChips";
import { BackLink } from "@/components/layout/BackLink";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCommunity } from "@/lib/community-store";

type Tab = "feed" | "groups";

const TABS: { id: Tab; label: string }[] = [
  { id: "feed", label: "Feed" },
  { id: "groups", label: "Groups" },
];

export function Community() {
  const { groups, posts, addGroup, addPost, deletePost, toggleLike, addComment, currentUser } =
    useCommunity();

  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  // Only one thread is open at a time, so the open post is tracked here.
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const visiblePosts = selectedGroupId
    ? posts.filter((post) => post.groupId === selectedGroupId)
    : posts;

  function showGroupFeed(groupId: string) {
    setSelectedGroupId(groupId);
    setActiveTab("feed");
  }

  return (
    <div className="px-4 pt-8 pb-8">
      <BackLink to="/tips" />
      <PageHeader title="Community" subtitle="Real people. Real stories. A stronger community." />

      <div className="mt-5 flex gap-6 border-b border-gray-200 text-sm font-semibold text-gray-500">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              "pb-2 " + (activeTab === tab.id ? "border-b-2 border-blue-500 text-blue-600" : "")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "feed" && (
        <div className="mt-4">
          <PostComposer groups={groups} onSubmit={addPost} />

          <div className="mt-4">
            <TopicChips
              groups={groups}
              selectedGroupId={selectedGroupId}
              onSelect={setSelectedGroupId}
            />
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {visiblePosts.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">
                No posts yet in this topic. Be the first to share!
              </p>
            )}

            {visiblePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                group={groups.find((group) => group.id === post.groupId)}
                canDelete={post.author === currentUser}
                expanded={expandedPostId === post.id}
                onToggleExpanded={() =>
                  setExpandedPostId(expandedPostId === post.id ? null : post.id)
                }
                onLike={() => toggleLike(post.id)}
                onDelete={() => deletePost(post.id)}
                onAddComment={(content) => addComment(post.id, content)}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === "groups" && (
        <div className="mt-4">
          <GroupComposer onSubmit={addGroup} />

          <div className="mt-4">
            <GroupList groups={groups} onSelect={showGroupFeed} />
          </div>
        </div>
      )}
    </div>
  );
}
