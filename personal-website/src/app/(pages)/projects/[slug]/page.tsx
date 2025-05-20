type Props = {
  params: { slug: string };
};

export default function ProjectDetailPage({ params }: Props) {
  return (
    <div>
      <h1>Project: {params.slug}</h1>
      <p>Details for project {params.slug}.</p>
    </div>
  );
} 