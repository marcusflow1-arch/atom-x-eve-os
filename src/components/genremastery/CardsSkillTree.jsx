import SkillTreeSystem from '@/components/achievements/SkillTreeSystem';

export default function CardsSkillTree({ genre }) {
  if (!genre) return null;
  return (
    <section className="cc-skill" aria-label="Genre skill tree">
      <div className="cc-scroll" style={{ paddingTop: 22 }}>
        <SkillTreeSystem genre={genre} />
      </div>
    </section>
  );
}
