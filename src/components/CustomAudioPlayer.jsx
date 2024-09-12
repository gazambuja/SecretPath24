import React, { useState, useRef, useEffect } from "react";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";

const CustomAudioPlayer = ({
  src,
  isVisible,
  onPlay,
  onPause,
  startAutoPlay,
  audioCurrentTime,
  setAudioCurrentTime,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(startAutoPlay);
  const [audioObject, setAudioObject] = useState("");

  const [audioDuration, setAudioDuration] = useState("0:00");
  const audioRef = useRef();

  function fancyTimeFormat(duration) {
    // Hours, minutes and seconds
    const hrs = ~~(duration / 3600);
    const mins = ~~((duration % 3600) / 60);
    const secs = ~~duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    let ret = "";

    if (hrs > 0) {
      ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;

    return ret;
  }

  useEffect(() => {
    setTimeout(() => {
      if (src) {
        setAudioObject(audioRef.current.playbackRate);
        setAudioDuration(audioRef.current.duration);
        setAudioCurrentTime(audioRef.current.currentTime);
      }
    }, "500");
  }, [src]);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setAutoPlay(false);
    } else {
      audioRef.current.play();
      setAutoPlay(true);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (onPlay) onPlay();
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (onPause) onPause();
  };

  const handlePlaybackRate = (speed) => {
    console.log("current speed =>", audioObject, "you want to: ", speed);

    if (audioRef.current.playbackRate == 1.5 && speed == "faster") {
      return;
    } else if (audioRef.current.playbackRate == 0.5 && speed == "slower") {
      return;
    } else if (speed == "slower") {
      audioRef.current.playbackRate = audioRef.current.playbackRate - 0.5;
    } else if (speed == "faster") {
      audioRef.current.playbackRate = audioRef.current.playbackRate + 0.5;
    }

    setAudioObject(audioRef.current.playbackRate);
  };

  if (!src || !isVisible) {
    return null;
  }

  const timeUpdate = (event) => {
    console.log("event", event.target.currentTime);
    setAudioCurrentTime(event.target.currentTime);
  };

  return (
    <div className="">
      <div className="fixed bottom-4 right-5 flex items-center bg-slate-500 p-4 rounded-3xl shadow-md flex-col">
        <div>
          <audio
            ref={audioRef}
            src={src}
            autoPlay={autoPlay}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={timeUpdate}
          />
        </div>
        <div id="durationDiv" className="bg-black p-2 rounded-3xl px-6">
          {fancyTimeFormat(audioCurrentTime)} / {fancyTimeFormat(audioDuration)}
        </div>
        <button
          onClick={togglePlayPause}
          className="bg-black hover:bg-blue-700 text-white font-bold p-3 rounded-full focus:outline-none focus:shadow-outline m-1"
        >
          <span className="size-5 font-sans">
            {isPlaying ? (
              <PauseIcon className="" />
            ) : (
              <PlayArrowIcon className="" />
            )}
          </span>
          <div></div>
        </button>
        <div
          id="playbackSpeedDiv"
          className="bg-black flex flex-row  p-1 rounded-3xl"
        >
          <button
            className="hover:bg-blue-700 rounded-3xl p-2"
            onClick={() => {
              handlePlaybackRate("slower");
            }}
          >
            <DirectionsWalkIcon />
          </button>
          <div className="m-auto min-h-6 min-w-8">{audioObject}</div>

          <button
            className="hover:bg-blue-700 rounded-3xl p-2 flex-row"
            onClick={() => {
              handlePlaybackRate("faster");
            }}
          >
            <DirectionsRunIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAudioPlayer;
