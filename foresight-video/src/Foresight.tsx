import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { DUR } from "./theme";
import { S1Open } from "./scenes/S1Open";
import { S2Scale } from "./scenes/S2Scale";
import { S3Causality } from "./scenes/S3Causality";
import { S4Depth } from "./scenes/S4Depth";
import { S5Engine } from "./scenes/S5Engine";
import { S6Preflight } from "./scenes/S6Preflight";
import { S7Close } from "./scenes/S7Close";

const xfade = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: DUR.fade })}
  />
);

export const Foresight: React.FC = () => {
  return (
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
      <TransitionSeries.Sequence durationInFrames={360} name="S6 Pre-flight">
        <S6Preflight />
      </TransitionSeries.Sequence>
      {xfade()}
      <TransitionSeries.Sequence durationInFrames={240} name="S7 收尾">
        <S7Close />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
