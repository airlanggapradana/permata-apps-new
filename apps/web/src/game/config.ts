import * as Phaser from "phaser";
import GameScene from "./scenes/GameScene";
import type { QuakeBridge } from "./quakeBridge";

export default function quakeConfig(
  parent: HTMLElement,
  bridge: QuakeBridge,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth || 900,
    height: parent.clientHeight || 620,
    backgroundColor: "#f4cdb1",
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
    audio: { noAudio: true },
    input: { keyboard: false, mouse: false, touch: false },
    scene: [new GameScene(bridge)],
  };
}
