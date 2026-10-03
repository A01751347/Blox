import { describe, expect, it } from 'vitest';
import { TEAM_IDS } from '@bloxdance/shared';
import { ACCESSORY_NAMES } from './accessories/accessoryTypes';
import { PANTS_TEMPLATES, SHIRT_TEMPLATES } from './clothing/clothingTypes';
import { EXTRA_KINDS, EYE_KINDS, MOUTH_KINDS } from './face/faceTypes';
import { CHARACTER_SPECS } from './characterLibrary';

describe('character roster data', () => {
  it('contains the 8 roster characters, two per team', () => {
    expect(CHARACTER_SPECS).toHaveLength(8);
    TEAM_IDS.forEach((team) => {
      expect(CHARACTER_SPECS.filter((spec) => spec.team === team)).toHaveLength(2);
    });
  });

  it('references only known pieces', () => {
    CHARACTER_SPECS.forEach((spec) => {
      expect(EYE_KINDS).toContain(spec.face.eyes);
      expect(MOUTH_KINDS).toContain(spec.face.mouth);
      spec.face.extras.forEach((extra) => expect(EXTRA_KINDS).toContain(extra));
      expect(SHIRT_TEMPLATES).toContain(spec.shirt.template);
      expect(PANTS_TEMPLATES).toContain(spec.pants.template);
      spec.accessories.forEach((name) => expect(ACCESSORY_NAMES).toContain(name));
    });
  });

  it('gives every character a visually distinct outfit', () => {
    const signatures = CHARACTER_SPECS.map((spec) =>
      JSON.stringify([spec.shirt, spec.pants, spec.accessories, spec.face, spec.skinTone]),
    );
    expect(new Set(signatures).size).toBe(8);
  });

  it('never uses the forbidden brand word', () => {
    expect(JSON.stringify(CHARACTER_SPECS).toLowerCase()).not.toContain('roblox');
  });
});
