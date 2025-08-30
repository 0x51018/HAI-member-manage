"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import apiFetch from '../../../lib/api';
import { z } from 'zod';
import { EventDetailSchema, EventParticipantSchema, MemberSummarySchema } from '@packages/types';

export default function EventDetailPage({ params }: { params: { eventId: string } }) {
  const { eventId } = params;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const res = await apiFetch(`/events/${eventId}`);
      const json = await res.json();
      return EventDetailSchema.parse(json);
    }
  });

  const { data: results } = useQuery({
    queryKey: ['memberSearch', search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const res = await apiFetch(`/members?q=${encodeURIComponent(search)}`);
      const json = await res.json();
      return z.array(MemberSummarySchema).parse(json);
    }
  });

  const addParticipant = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await apiFetch(`/events/${eventId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberStudentIds: [studentId] })
      });
      const json = await res.json();
      return z.array(EventParticipantSchema).parse(json);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    }
  });

  const exportFile = async (format: 'csv' | 'txt') => {
    const res = await apiFetch(`/events/${eventId}/export?fields=phone,name&format=${format}`);
    const text = await res.text();
    const blob = new Blob([text], {
      type: format === 'txt' ? 'text/plain' : 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-${eventId}.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error || !data) return <div>Failed to load</div>;

  return (
    <div>
      <h1>{data.title}</h1>
      <button onClick={() => exportFile('csv')}>Export CSV</button>
      <button onClick={() => exportFile('txt')}>Export TXT</button>
      <h2>Participants</h2>
      <ul>
        {data.participants.map((p) => (
          <li key={p.memberStudentId}>
            {p.name} ({p.memberStudentId}) {p.phone ?? ''}
          </li>
        ))}
      </ul>
      <h3>Add Participant</h3>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search members"
      />
      {results && results.length > 0 && (
        <ul>
          {results.map((m) => (
            <li key={m.studentId}>
              {m.name} ({m.studentId}){' '}
              <button
                onClick={() => addParticipant.mutate(m.studentId)}
                disabled={addParticipant.isLoading}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
