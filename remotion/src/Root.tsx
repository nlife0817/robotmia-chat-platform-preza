import { Composition } from "remotion";
import { Scene1Assign, SCENE1_DURATION, SCENE1_FPS } from "./Scene1Assign";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Scene1Assign"
        component={Scene1Assign}
        durationInFrames={SCENE1_DURATION}
        fps={SCENE1_FPS}
        width={1660}
        height={690}
      />
    </>
  );
};
