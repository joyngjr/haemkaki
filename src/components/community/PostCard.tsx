import { useState } from "react";

import { timeAgo, type Group, type Post } from "@/lib/community-store";

import { CommentIcon, HeartIcon, TrashIcon } from "./PostIcons";

/**
 * The comment thread, shown once the reader expands the post. The draft lives in
 * PostCard rather than here so collapsing the thread does not discard it.
 */
function CommentThread({
  post,
  draft,
  onDraftChange,
  onSubmit,
}: {
  post: Post;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {post.comments.length === 0 && (
        <p className="text-xs text-gray-400">No comments yet. Be the first to reply.</p>
      )}
      <div className="flex flex-col gap-3">
        {post.comments.map((comment) => (
          <div key={comment.id} className="rounded-lg bg-gray-50 p-2.5">
            <p className="text-xs font-semibold text-gray-800">{comment.author}</p>
            <p className="mt-0.5 text-xs text-gray-600">{comment.content}</p>
            <p className="mt-0.5 text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs"
        />
        <button
          onClick={onSubmit}
          className="rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Reply
        </button>
      </div>
    </div>
  );
}

type PostCardProps = {
  post: Post;
  /** The post's group, if it still exists. */
  group: Group | undefined;
  /** Only the reader's own posts get a delete button. */
  canDelete: boolean;
  /** Expansion is owned by the feed so only one thread is open at a time. */
  expanded: boolean;
  onToggleExpanded: () => void;
  onLike: () => void;
  onDelete: () => void;
  onAddComment: (content: string) => void;
};

/** One post in the feed, with its like/comment actions and thread. */
export function PostCard({
  post,
  group,
  canDelete,
  expanded,
  onToggleExpanded,
  onLike,
  onDelete,
  onAddComment,
}: PostCardProps) {
  const [commentDraft, setCommentDraft] = useState("");

  function submitComment() {
    if (!commentDraft.trim()) return;
    onAddComment(commentDraft.trim());
    setCommentDraft("");
  }

  return (
    <div className="rounded-[20px] bg-white p-4 shadow-md">
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

        {canDelete && (
          <button
            onClick={() => {
              if (window.confirm("Delete this post?")) onDelete();
            }}
            className="text-gray-400"
            aria-label="Delete post"
          >
            <TrashIcon />
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
        <button onClick={onLike} className="flex items-center gap-1.5">
          <HeartIcon filled={post.likedByMe} />
          {post.likes}
        </button>

        <button onClick={onToggleExpanded} className="flex items-center gap-1.5">
          <CommentIcon />
          {post.comments.length}
        </button>
      </div>

      {expanded && (
        <CommentThread
          post={post}
          draft={commentDraft}
          onDraftChange={setCommentDraft}
          onSubmit={submitComment}
        />
      )}
    </div>
  );
}
