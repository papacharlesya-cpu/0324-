import "./index.css";
import React from "react";
import { Composition, Folder } from "remotion";
import { Foresight } from "./Foresight";
import { FPS, H, TOTAL, W } from "./theme";
import { S1Open } from "./scenes/S1Open";
import { S2Scale } from "./scenes/S2Scale";
import { S3Causality } from "./scenes/S3Causality";
import { S4Depth } from "./scenes/S4Depth";
import { S5Engine } from "./scenes/S5Engine";
import { S6Preflight } from "./scenes/S6Preflight";
import { S7Close } from "./scenes/S7Close";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Foresight"
        component={Foresight}
        durationInFrames={TOTAL}
        fps={FPS}
        width={W}
        height={H}
      />
      <Folder name="Scenes">
        <Composition id="S1" component={S1Open} durationInFrames={150} fps={FPS} width={W} height={H} />
        <Composition id="S2" component={S2Scale} durationInFrames={270} fps={FPS} width={W} height={H} />
        <Composition id="S3" component={S3Causality} durationInFrames={300} fps={FPS} width={W} height={H} />
        <Composition id="S4" component={S4Depth} durationInFrames={240} fps={FPS} width={W} height={H} />
        <Composition id="S5" component={S5Engine} durationInFrames={300} fps={FPS} width={W} height={H} />
        <Composition id="S6" component={S6Preflight} durationInFrames={360} fps={FPS} width={W} height={H} />
        <Composition id="S7" component={S7Close} durationInFrames={240} fps={FPS} width={W} height={H} />
      </Folder>
    </>
  );
};
