export type SpawnZone = {
  id: string;
  x: number;
  y: number;
  radius: number;
};

export type RectBlocker = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SpawnWorld = {
  width: number;
  height: number;
};

export type SpawnPoint = {
  x: number;
  y: number;
};

export function isSafeSpawnPoint(
  point: SpawnPoint,
  input: { blockers: readonly RectBlocker[]; world: SpawnWorld; padding: number }
): boolean {
  if (
    point.x < input.padding ||
    point.y < input.padding ||
    point.x > input.world.width - input.padding ||
    point.y > input.world.height - input.padding
  ) {
    return false;
  }

  return !input.blockers.some((blocker) => pointInsideInflatedRect(point, blocker, input.padding));
}

export function findSafeSpawnPoint(input: {
  zone: SpawnZone;
  blockers: readonly RectBlocker[];
  world: SpawnWorld;
  padding?: number;
  attempts?: number;
  random?: () => number;
}): SpawnPoint {
  const padding = input.padding ?? 44;
  const attempts = input.attempts ?? 16;
  const random = input.random ?? Math.random;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * input.zone.radius;
    const point = {
      x: input.zone.x + Math.cos(angle) * distance,
      y: input.zone.y + Math.sin(angle) * distance
    };
    if (isSafeSpawnPoint(point, { blockers: input.blockers, world: input.world, padding })) return point;
  }

  return findCenterBiasedFallback(input.zone, input.blockers, input.world, padding);
}

function pointInsideInflatedRect(point: SpawnPoint, blocker: RectBlocker, padding: number): boolean {
  return (
    point.x >= blocker.x - padding &&
    point.x <= blocker.x + blocker.width + padding &&
    point.y >= blocker.y - padding &&
    point.y <= blocker.y + blocker.height + padding
  );
}

function findCenterBiasedFallback(
  zone: SpawnZone,
  blockers: readonly RectBlocker[],
  world: SpawnWorld,
  padding: number
): SpawnPoint {
  const center = { x: world.width / 2, y: world.height / 2 };
  const dx = center.x - zone.x;
  const dy = center.y - zone.y;
  const length = Math.max(1, Math.hypot(dx, dy));

  for (let distance = zone.radius; distance <= Math.max(world.width, world.height); distance += 24) {
    const point = {
      x: clamp(zone.x + (dx / length) * distance, padding, world.width - padding),
      y: clamp(zone.y + (dy / length) * distance, padding, world.height - padding)
    };
    if (isSafeSpawnPoint(point, { blockers, world, padding })) return point;
  }

  return {
    x: clamp(center.x, padding, world.width - padding),
    y: clamp(center.y, padding, world.height - padding)
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
