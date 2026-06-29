# Weapon Selection Flow Design

## Goal

Replace persistent inventory and in-run weapon swapping with a dedicated pre-run weapon selection screen. The selected weapon is locked for the entire run.

## Player Flow

1. The player selects difficulty on the main menu and chooses Start or Continue.
2. The game opens a dedicated weapon selection scene.
3. The player inspects all nine weapons and confirms one weapon.
4. The arena starts with the chosen difficulty and weapon.
5. The weapon cannot be changed until the run ends and the player starts another run.

## Weapon Selection UI

The scene uses the existing slaughterhouse visual language. It displays a large world-weapon preview, weapon name, rarity, description, damage, attacks per second, range, critical bonus, and attack style. Clicking a card changes the preview; the confirm button starts the arena. A back button returns to the menu.

## Removed Behavior

- Remove the `B` backpack shortcut and HUD backpack panel.
- Remove all in-arena weapon equip events.
- Remove owned-weapon and equipped-weapon persistence.
- Bosses and ordinary enemies do not drop weapons.
- Continue does not reuse the previous run's weapon; it opens weapon selection.

## Data Flow

`MenuScene` starts `WeaponSelectScene` with `difficultyId`. `WeaponSelectScene` starts `ArenaScene` with `difficultyId` and `weaponId`. `ArenaScene` validates the weapon through `getWeaponDefinition()` and equips it once during creation. Restart preserves the current run's weapon; returning to menu resets the flow.

## Verification

Tests cover scene registration, weapon selection fallback, menu routing, arena start data, and removal of inventory persistence. Production build and browser checks verify the new screen, selected weapon rendering, and absence of the backpack UI.
