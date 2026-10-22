"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { SeedImage } from "@/components/shared/SeedImage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/data/api";
import { relativeTime } from "@/lib/format";
import { personName } from "@/lib/project-view";
import type { SiteUpdate, User } from "@/types";

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function CommentThread({ update, users, userId }: { update: SiteUpdate; users: User[]; userId: string }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) {
      setError("Write a comment");
      return;
    }
    setPending(true);
    try {
      await api.addUpdateComment(userId, update.id, text);
      setText("");
      setError("");
      toast.success("Comment added");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not add the comment");
    } finally {
      setPending(false);
    }
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground">Discussion</h3>
      {update.thread.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {update.thread.map((comment) => {
            const name = personName(users, comment.authorId);
            const photo = users.find((user) => user.id === comment.authorId)?.avatarUrl;
            return (
              <li key={comment.id} className="flex gap-3">
                <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-medium">
                  {photo ? <SeedImage src={photo} alt="" sizes="32px" /> : initials(name)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    {name} <span className="text-xs text-muted-foreground">{relativeTime(comment.createdAt)}</span>
                  </p>
                  <p className="mt-1 text-sm text-foreground">{comment.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={submit} className="mt-4 space-y-2">
        <label className="sr-only" htmlFor={`comment-${update.id}`}>
          Add a comment
        </label>
        <Textarea
          id={`comment-${update.id}`}
          value={text}
          aria-invalid={error ? true : undefined}
          placeholder="Add a comment"
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError("");
          }}
        />
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <Button type="submit" variant="outline" disabled={pending}>
          Comment
        </Button>
      </form>
    </section>
  );
}
