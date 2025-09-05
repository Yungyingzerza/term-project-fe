import { Search, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setAmbientColor } from "@/store/playerSlice";

export default function TopBar() {
  const navigate = useRouter();
  const dispatch = useDispatch();

  //handle navigation
  const handleNavigation = (link: string) => {
    dispatch(setAmbientColor("transparent"));

    navigate.push(link);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-white/10 bg-neutral-950/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-3">
        <div className="flex items-center gap-2 font-extrabold text-lg">
          <div className="w-7 h-7 rounded-lg bg-white text-black grid place-items-center">
            TT
          </div>
          <span className="hidden sm:inline">ModernTok</span>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <div className="group relative">
            <input
              placeholder="Search"
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-12 py-2.5 outline-none focus:border-white/20"
            />
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 bg-white/10 rounded-md text-white/60">
              /
            </kbd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden cursor-pointer sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-black font-semibold hover:opacity-90">
            <Upload className="w-4 h-4" /> Upload
          </button>

          <button
            className="inline-block cursor-pointer"
            onClick={() => handleNavigation("/profile")}
          >
            <img
              src="https://i.pravatar.cc/80?img=5"
              className="w-8 h-8 rounded-full"
              alt="Profile"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
