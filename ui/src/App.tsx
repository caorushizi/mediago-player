import { List } from "lucide-react";
import { useAsyncEffect, useMemoizedFn } from "ahooks";
import { useId, useRef, useState } from "react";
import Player from "xgplayer";
import { cn, getVideoURL, http } from "./utils";
import "xgplayer/dist/index.min.css";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Video {
  url: string;
  title: string;
}

export default function PlayerPage() {
  const player = useRef<Player>();
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState("");
  const [open, setOpen] = useState(false);
  const playerId = useId();

  useAsyncEffect(async () => {
    let url = "";
    try {
      const res = await http.get("/api/v1/videos");
      setVideoList(res.data);
      setCurrentVideo(res.data[0].url);
      url = res.data[0].url;
    } catch (e) {
      console.error("failToFetchVideoList", e);
    } finally {
      player.current = new Player({
        id: playerId,
        height: "100%",
        width: "100%",
        lang: "zh-cn",
        url,
      });
    }
  }, []);

  const handleVideoClick = useMemoizedFn((url: string) => {
    if (!player.current) return;

    setCurrentVideo(url);
    player.current.src = getVideoURL(url);
    player.current.play();

    setOpen(false);
  });

  const onClose = useMemoizedFn(() => {
    setOpen(false);
  });

  const handleOpen = useMemoizedFn(() => {
    setOpen(true);
  });

  return (
    <div className="group relative flex h-full w-full flex-col dark:bg-[#141415] md:flex-row">
      {/* Desktop/Tablet: Show list button on hover (hidden on mobile) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="absolute right-5 top-5 z-50 hidden cursor-pointer items-center gap-2 rounded-md border border-white/80 bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition-all hover:bg-black/70 md:group-hover:flex"
            onClick={handleOpen}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Playlist</span>
          </button>
        </SheetTrigger>

        {/* Desktop/Tablet: Right drawer (not used on mobile) */}
        <SheetContent
          side="right"
          className="hidden w-full sm:max-w-md md:block md:max-w-lg"
          onInteractOutside={onClose}
        >
          <SheetHeader>
            <SheetTitle>Playlist</SheetTitle>
          </SheetHeader>
          <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
            <ul className="flex flex-col gap-1 pr-4">
              {videoList.map((video) => (
                <li
                  key={video.url}
                  className={cn(
                    "cursor-pointer rounded-md p-3 text-sm transition-colors hover:bg-accent",
                    {
                      "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400":
                        video.url === currentVideo,
                    }
                  )}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => handleVideoClick(video.url)}
                  >
                    <div className="line-clamp-2">{video.title}</div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Video Player - Mobile has reduced height */}
      <div className="relative h-[40vh] w-full md:h-full">
        <div id={playerId} className="h-full w-full" />
      </div>

      {/* Mobile: Bottom video list (visible only on small screens) */}
      <div className="block flex-1 overflow-hidden border-t border-border bg-background md:hidden">
        <div className="flex h-full flex-col p-4">
          <h3 className="mb-3 text-sm font-semibold">Playlist</h3>
          <ScrollArea className="flex-1">
            <ul className="flex flex-col gap-2 pr-4">
              {videoList.map((video) => (
                <li key={video.url}>
                  <button
                    type="button"
                    onClick={() => handleVideoClick(video.url)}
                    className={cn(
                      "w-full rounded-md border p-3 text-left text-sm transition-colors hover:bg-accent",
                      {
                        "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400":
                          video.url === currentVideo,
                      }
                    )}
                  >
                    <div className="line-clamp-2">{video.title}</div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
