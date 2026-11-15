// Bot dressing: helmets, visors, vest plates, shoulder pads, knee pads, team
// armbands and a backpack antenna. Visual only — hit meshes (torso/head)
// are untouched and no logic changes.
import * as THREE from 'three';

export function dressBot(group, team) {
  const attack = team === 'attack';
  const suit = new THREE.MeshStandardMaterial({
    color: new THREE.Color(attack ? '#3a4a5e' : '#5e3a2a'), roughness: 0.75, metalness: 0.1,
  });
  const teamGlow = new THREE.MeshStandardMaterial({
    color: new THREE.Color(attack ? '#4aa3ff' : '#e8532f'),
    emissive: new THREE.Color(attack ? '#4aa3ff' : '#e8532f'), emissiveIntensity: 0.5,
    roughness: 0.4, metalness: 0.2,
  });
  const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color('#14161a'), roughness: 0.6, metalness: 0.3 });
  const vest = new THREE.MeshStandardMaterial({ color: new THREE.Color('#23262e'), roughness: 0.85, metalness: 0.1 });
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = true; group.add(m); return m;
  };
  // helmet: dome + brim + rear rim
  const helm = add(new THREE.SphereGeometry(0.175, 12, 8, 0, Math.PI * 2, 0, 1.35), suit, 0, 1.63, 0);
  void helm;
  add(new THREE.CylinderGeometry(0.19, 0.2, 0.03, 12), dark, 0, 1.6, 0);
  add(new THREE.BoxGeometry(0.2, 0.04, 0.1), suit, 0, 1.58, -0.16);
  // visor strip across the face (front is -z, same side as the gun)
  add(new THREE.BoxGeometry(0.24, 0.05, 0.03), teamGlow, 0, 1.64, -0.15);
  add(new THREE.BoxGeometry(0.1, 0.03, 0.02), dark, 0, 1.55, -0.16);
  // vest plate + pouches on the chest
  add(new THREE.BoxGeometry(0.42, 0.5, 0.07), vest, 0, 1.12, -0.17);
  add(new THREE.BoxGeometry(0.12, 0.16, 0.04), dark, -0.12, 1.05, -0.21);
  add(new THREE.BoxGeometry(0.12, 0.16, 0.04), dark, 0.12, 1.05, -0.21);
  add(new THREE.BoxGeometry(0.3, 0.06, 0.04), teamGlow, 0, 1.36, -0.21);
  // shoulder pads + team armband on the left arm
  add(new THREE.BoxGeometry(0.2, 0.07, 0.36), suit, -0.33, 1.47, 0);
  add(new THREE.BoxGeometry(0.2, 0.07, 0.36), suit, 0.33, 1.47, 0);
  add(new THREE.BoxGeometry(0.19, 0.06, 0.37), teamGlow, -0.33, 1.32, 0);
  // knee pads
  add(new THREE.BoxGeometry(0.15, 0.14, 0.05), vest, -0.12, 0.55, -0.1);
  add(new THREE.BoxGeometry(0.15, 0.14, 0.05), vest, 0.12, 0.55, -0.1);
  // backpack antenna with a glowing tip
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 6), dark, 0.14, 1.5, 0.24);
  add(new THREE.SphereGeometry(0.025, 8, 6), teamGlow, 0.14, 1.68, 0.24);
  // balaclava face mask under the visor + helmet stripe
  add(new THREE.BoxGeometry(0.2, 0.13, 0.03), dark, 0, 1.5, -0.15);
  add(new THREE.BoxGeometry(0.05, 0.015, 0.3), teamGlow, 0, 1.79, 0);
  // belt + pouches
  add(new THREE.BoxGeometry(0.46, 0.09, 0.32), vest, 0, 0.78, 0);
  add(new THREE.BoxGeometry(0.1, 0.12, 0.05), dark, -0.12, 0.76, -0.18);
  add(new THREE.BoxGeometry(0.1, 0.12, 0.05), dark, 0.12, 0.76, -0.18);
  // boots
  add(new THREE.BoxGeometry(0.17, 0.09, 0.3), dark, -0.12, 0.045, 0.02);
  add(new THREE.BoxGeometry(0.17, 0.09, 0.3), dark, 0.12, 0.045, 0.02);
  // backpack pouches + bedroll on the back
  add(new THREE.BoxGeometry(0.14, 0.18, 0.06), dark, -0.1, 1.1, 0.22);
  add(new THREE.BoxGeometry(0.14, 0.18, 0.06), dark, 0.1, 1.1, 0.22);
  const bedroll = add(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 8), suit, 0, 1.45, 0.22);
  bedroll.rotation.z = Math.PI / 2;
  // shoulder radio + antenna
  add(new THREE.BoxGeometry(0.08, 0.12, 0.04), dark, -0.2, 1.28, -0.18);
  add(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6), dark, -0.2, 1.42, -0.18);
  add(new THREE.SphereGeometry(0.018, 8, 6), teamGlow, -0.2, 1.53, -0.18);
  // gloved hands on the rifle (front is -z)
  add(new THREE.BoxGeometry(0.09, 0.08, 0.12), dark, 0.2, 1.18, -0.15);
  add(new THREE.BoxGeometry(0.09, 0.08, 0.12), dark, 0.2, 1.16, -0.42);
}
