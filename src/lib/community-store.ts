import { useEffect, useState } from "react";

export type Group = {
  id: string;
  name: string;
  description: string;
  color: string;
  memberCount: number;
};

export type Comment = {
  id: string;
  author: string;
  content: string;
  createdAt: number;
};

export type Post = {
  id: string;
  groupId: string;
  author: string;
  title: string;
  content: string;
  createdAt: number;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
};

const STORAGE_KEY = "hackitrx.community";
const CURRENT_USER = "You";

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function defaultGroups(): Group[] {
  return [
    {
      id: "living-with-haemophilia",
      name: "Living with Haemophilia",
      description: "General life with haemophilia.",
      color: "#ec4899",
      memberCount: 1200,
    },
    {
      id: "treatment-routines",
      name: "Treatment Routines",
      description: "Share and compare treatment routines.",
      color: "#3b82f6",
      memberCount: 980,
    },
    {
      id: "parents-caregivers",
      name: "Parents & Caregivers",
      description: "For parents and caregivers of people with haemophilia.",
      color: "#8b5cf6",
      memberCount: 1100,
    },
    {
      id: "school-work",
      name: "School & Work",
      description: "Balancing school, work, and haemophilia.",
      color: "#f59e0b",
      memberCount: 740,
    },
    {
      id: "travel",
      name: "Travel",
      description: "Tips for travelling with factor and equipment.",
      color: "#0ea5e9",
      memberCount: 620,
    },
    {
      id: "newly-diagnosed",
      name: "Newly Diagnosed",
      description: "Support for people who are newly diagnosed.",
      color: "#22c55e",
      memberCount: 540,
    },
  ];
}

function defaultPosts(): Post[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: makeId(),
      groupId: "travel",
      author: "Alex T.",
      title: "Tips for travelling with factor?",
      content:
        "I'll be travelling to Japan next month and would love to hear how others keep their medication cool and handle airport security. Any tips?",
      createdAt: now - 2 * day,
      likes: 12,
      likedByMe: false,
      comments: [
        {
          id: makeId(),
          author: "Priya S.",
          content:
            "An insulated pouch with a small ice pack works well, and I always carry a doctor's letter for security.",
          createdAt: now - 1.5 * day,
        },
      ],
    },
    {
      id: makeId(),
      groupId: "living-with-haemophilia",
      author: "Sarah L.",
      title: "Staying active with haemophilia",
      content:
        "Just wanted to share that I've started swimming again and it's been great for my mental health!",
      createdAt: now - 5 * day,
      likes: 9,
      likedByMe: false,
      comments: [],
    },
  ];
}

type CommunityData = {
  groups: Group[];
  posts: Post[];
};

function loadData(): CommunityData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { groups: defaultGroups(), posts: defaultPosts() };
    const parsed = JSON.parse(raw) as CommunityData;
    if (!parsed.groups || !parsed.posts) return { groups: defaultGroups(), posts: defaultPosts() };
    return parsed;
  } catch {
    return { groups: defaultGroups(), posts: defaultPosts() };
  }
}

function saveData(data: CommunityData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* not worth surfacing */
  }
}

export function useCommunity() {
  const [data, setData] = useState<CommunityData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  function addGroup(name: string, description: string, color: string) {
    const newGroup: Group = {
      id: makeId(),
      name,
      description,
      color,
      memberCount: 1,
    };
    setData((prev) => ({ ...prev, groups: [...prev.groups, newGroup] }));
    return newGroup;
  }

  function addPost(groupId: string, title: string, content: string) {
    const newPost: Post = {
      id: makeId(),
      groupId,
      author: CURRENT_USER,
      title,
      content,
      createdAt: Date.now(),
      likes: 0,
      likedByMe: false,
      comments: [],
    };
    setData((prev) => ({ ...prev, posts: [newPost, ...prev.posts] }));
  }

  function deletePost(postId: string) {
    setData((prev) => ({ ...prev, posts: prev.posts.filter((post) => post.id !== postId) }));
  }

  function toggleLike(postId: string) {
    setData((prev) => ({
      ...prev,
      posts: prev.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              likedByMe: !post.likedByMe,
              likes: post.likedByMe ? post.likes - 1 : post.likes + 1,
            }
          : post,
      ),
    }));
  }

  function addComment(postId: string, content: string) {
    const newComment: Comment = {
      id: makeId(),
      author: CURRENT_USER,
      content,
      createdAt: Date.now(),
    };
    setData((prev) => ({
      ...prev,
      posts: prev.posts.map((post) =>
        post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post,
      ),
    }));
  }

  return {
    groups: data.groups,
    posts: data.posts,
    addGroup,
    addPost,
    deletePost,
    toggleLike,
    addComment,
    currentUser: CURRENT_USER,
  };
}

export function timeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / (60 * 1000));
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes + (minutes === 1 ? " minute ago" : " minutes ago");
  if (hours < 24) return hours + (hours === 1 ? " hour ago" : " hours ago");
  return days + (days === 1 ? " day ago" : " days ago");
}
