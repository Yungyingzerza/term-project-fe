import VideoPlayer from "@/components/VideoPlayer";

export default function Home() {
  return (
    <>
      <div className="h-[100svh] flex items-center justify-center">
        <div className="h-[90svh] ">
          <VideoPlayer />
        </div>
      </div>
    </>
  );
}
