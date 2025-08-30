"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import apiFetch from '../../lib/api';
import { z } from 'zod';
import { EventSchema } from '@packages/types';
import { useRouter } from 'next/navigation';

export default function EventsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [termId, setTermId] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await apiFetch('/events');
      const json = await res.json();
      return z.array(EventSchema).parse(json);
    }
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      const body: any = { title };
      if (type) body.type = type;
      if (termId) body.termId = termId;
      const res = await apiFetch('/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      return EventSchema.parse(json);
    },
    onSuccess: (event) => {
      setTitle('');
      setType('');
      setTermId('');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      router.push(`/events/${event.id}`);
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load</div>;

  return (
    <div>
      <h1>Events</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          createEvent.mutate();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
        />
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Type (optional)"
        />
        <input
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
          placeholder="Term ID (optional)"
        />
        <button type="submit" disabled={createEvent.isLoading}>
          Create Event
        </button>
      </form>
      <h2>Event List</h2>
      <table border={1} cellPadding={4}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {data!.map((ev) => (
            <tr key={ev.id}>
              <td>
                <Link href={`/events/${ev.id}`}>{ev.title}</Link>
              </td>
              <td>{new Date(ev.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
