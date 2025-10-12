export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // If it's already a full URL, return it as is
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // For local images, you can add your own CDN logic here
  return src;
}
