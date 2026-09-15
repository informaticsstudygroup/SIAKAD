export type BatchWithRelations = {
  id: string;
  name: string;
  period: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  isActive: boolean;
  mentorId: string | null;
  coMentorId: string | null;
  mentor: { id: string; name: string } | null;
  coMentor: { id: string; name: string } | null;
  _count: { participants: number };
};

export type MentorOption = { id: string; name: string };
