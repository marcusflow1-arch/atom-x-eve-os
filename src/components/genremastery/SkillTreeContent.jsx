import SkillTreeSystem from '@/components/achievements/SkillTreeSystem';

export default function SkillTreeContent({ genre }) {
  if (!genre) return null;
  return (
    <div className="h-full overflow-y-auto p-6">
      <SkillTreeSystem genre={genre} />
    </div>
  );
}
