'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '../../../lib/api';
import Link from 'next/link';
import { z } from 'zod';
import {
  SectionSchema,
  TeamSchema,
  TeamCreateSchema,
  TeamLeaderSchema
} from '@packages/types';

const SectionWithTeamsSchema = SectionSchema.extend({
  teams: z.array(TeamSchema)
});

export default function SectionDetailPage({
  params,
  searchParams
}: {
  params: { sectionId: string };
  searchParams: { termId?: string };
}) {
  const termId = searchParams.termId;
  const queryClient = useQueryClient();
  const [teamNumber, setTeamNumber] = useState('');
  const [teamName, setTeamName] = useState('');
  const [leaderInputs, setLeaderInputs] = useState<Record<string, string>>({});

  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['termSections', termId],
    queryFn: async () => {
      if (!termId) return [] as any;
      const res = await apiFetch(`/terms/${termId}/sections?with=teams`);
      const json = await res.json();
      return z.array(SectionWithTeamsSchema).parse(json);
    },
    enabled: !!termId
  });

  const section = data?.find((s) => s.id === params.sectionId);

  const createTeam = useMutation({
    mutationFn: async () => {
      const body = TeamCreateSchema.parse({
        teamNumber: Number(teamNumber),
        name: teamName || undefined
      });
      const res = await apiFetch(`/sections/${params.sectionId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      return TeamSchema.parse(json);
    },
    onSuccess: () => {
      setTeamNumber('');
      setTeamName('');
      queryClient.invalidateQueries({ queryKey: ['termSections', termId] });
    }
  });

  const setLeader = useMutation({
    mutationFn: async (vars: { teamId: string; memberStudentId: string }) => {
      const body = TeamLeaderSchema.parse({ memberStudentId: vars.memberStudentId });
      await apiFetch(`/teams/${vars.teamId}/leader`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['termSections', termId] });
    }
  });

  const generateSessions = useMutation({
    mutationFn: async () => {
      await apiFetch(`/attendance/sections/${params.sectionId}/sessions/generate`, {
        method: 'POST'
      });
    }
  });

  if (!termId) return <div>termId required</div>;
  if (isLoading) return <div>Loading...</div>;
  if (error || !section) return <div>Failed to load</div>;

  return (
    <div>
      <h1>Section {section.name}</h1>
      <Link href={`/sections/${params.sectionId}/attendance`}>Attendance Sessions</Link>
      <button onClick={() => generateSessions.mutate()} disabled={generateSessions.isPending}>
        Generate Sessions
      </button>

      <h2>Create Team</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!teamNumber) return;
          createTeam.mutate();
        }}
      >
        <input
          type="number"
          value={teamNumber}
          onChange={(e) => setTeamNumber(e.target.value)}
          placeholder="Team Number"
          required
        />
        <input
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Team Name (optional)"
        />
        <button type="submit" disabled={createTeam.isLoading}>
          Create Team
        </button>
      </form>

      <h2>Teams</h2>
      <ul>
        {section.teams.map((team) => (
          <li key={team.id}>
            Team {team.teamNumber} {team.name ?? ''}
            <br />
            <input
              value={leaderInputs[team.id] ?? ''}
              onChange={(e) =>
                setLeaderInputs((prev) => ({ ...prev, [team.id]: e.target.value }))
              }
              placeholder="Leader Student ID"
            />
            <button
              onClick={() =>
                setLeader.mutate({
                  teamId: team.id,
                  memberStudentId: leaderInputs[team.id] ?? ''
                })
              }
              disabled={setLeader.isPending}
            >
              Set Leader
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
