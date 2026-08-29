import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { DUR } from "./theme";
import { S1Open } from "./scenes/S1Open";
import { S2Scale } from "./scenes/S2Scale";
import { S3Causality } from "./scenes/S3Causality";
import { S4Depth } from "./scenes/S4Depth";
import { S5Engine } from "./scenes/S5Engine";
import { D1Ask } from "./scenes/D1Ask";
import { D2Think } from "./scenes/D2Think";
import { D3Execute } from "./scenes/D3Execute";
import { D4Loop } from "./scenes/D4Loop";
import { S7Close } from "./scenes/S7Close";

const xfade = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: DUR.fade })}
  />
);

export const Foresight: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("music.wav")} />
      <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={150} name="S1 開場">
        <S1Open />
      </TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={270} name="S2 資料規模">
        <S2Scale />
      </TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={300} name="S3 操作因果">
        <S3Causality />
      </TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={240} name="S4 十五年">
        <S4Depth />
      </TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={300} name="S5 三層引擎">
        <S5Engine />
      </TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={240} name="D1 說需求">
        <D1Ask />
      </TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={300} name="D2 引擎思考">
        <D2Think />
      </TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={300} name="D3 動手執行">
        <D3Execute />
      </TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={300} name="D4 成效回圈">
        <D4Loop />
      </TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={240} name="S7 收尾">
        <S7Close />
      </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
