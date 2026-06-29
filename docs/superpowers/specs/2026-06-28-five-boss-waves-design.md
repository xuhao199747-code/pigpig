# Five Boss Waves Design

## Goal

Add a distinct oversized boss to waves 2, 4, 6, 8, and 10. Each boss appears after the wave's normal enemies are cleared and never drops weapons.

## Boss Roster

- Wave 2: Iron Barrel Boar, a plated charging boss.
- Wave 4: Feed Mountain, a swollen boss that uses ground slams.
- Wave 6: Forklift Hog, a machinery-covered charging boss.
- Wave 8: Stitched Pen Beast, a grotesque boss that periodically summons small pigs.
- Wave 10: Dusk Pig King, the existing final boss with the strongest mixed pressure.

## Behavior Model

Boss behavior is data-driven through `bossBehavior`. `charge` periodically accelerates toward the player, `slam` creates a damage pulse at close range, and `summon` requests small-pig reinforcements. Boss rewards remain their configured experience and coins; no weapon reward path exists.

## Wave Flow

Even waves spawn their normal enemy budget first. Once all normal enemies are spawned and defeated, `WaveDirector` emits exactly one boss spawn. The wave advances only after that boss dies.
