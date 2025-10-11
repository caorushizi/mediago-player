import {UnorderedListOutlined} from "@ant-design/icons";
import {useAsyncEffect, useMemoizedFn} from "ahooks";
import {Drawer} from "antd";
import {useId, useRef, useState} from "react";
import Player from "xgplayer";
import {cn, getVideoURL, http} from "./utils";
import "xgplayer/dist/index.min.css";

export default function PlayerPage() {
  const player = useRef<Player>();
  const [videoList, setVideoList] = useState<any[]>([]);
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
    <div className="group relative flex h-full w-full dark:bg-[#141415] size-full">
      <button
        type={"button"}
        className="absolute right-5 top-5 z-50 hidden cursor-pointer items-center rounded-sm border border-white px-1.5 py-0.5 text-center group-hover:block"
        onClick={handleOpen}
      >
        <UnorderedListOutlined className="text-white" />
      </button>
      <div id={playerId} className="h-full w-full" />
      <Drawer
        title={"playList"}
        placement={"right"}
        closable={false}
        onClose={onClose}
        open={open}
        key={"right"}
      >
        <ul className="flex flex-col gap-1">
          {videoList.map((video) => (
            <li
              className={cn(
                "m-2 line-clamp-2 cursor-pointer text-sm dark:text-white",
                {
                  "text-blue-500 dark:text-blue-500":
                    video.url === currentVideo,
                },
              )}
              key={video.url}
            >
              <button
                type={"button"}
                onClick={() => handleVideoClick(video.url)}
              >
                {video.title}
              </button>
            </li>
          ))}
        </ul>
      </Drawer>
    </div>
  );
}
