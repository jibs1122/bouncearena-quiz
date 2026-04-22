export default function YouTubeEmbed({ id }: { id: string }) {
  return (
    <div className="relative aspect-video w-full rounded-xl overflow-hidden my-6">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
