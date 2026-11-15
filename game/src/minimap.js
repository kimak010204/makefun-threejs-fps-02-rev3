// Live tactical minimap: a small canvas in the HUD corner that draws the yard
const MAP_W = 46;
const MAP_H = 38;
const VIEW = 180;
const SCALE = VIEW / MAP_W;

function project(x, z) {
  return [VIEW / 2 + x * SCALE, VIEW / 2 + z * SCALE];
}

export function createMinimap(canvas) {
  const ctx = canvas.getContext('2d');
  const base = document.createElement('canvas');
  base.width = VIEW;
  base.height = VIEW;
  const b = base.getContext('2d');
  b.fillStyle = '#12151c';
  b.fillRect(0, 0, VIEW, VIEW);
  b.fillStyle = '#1d222d';
  b.fillRect(2, 2, VIEW - 4, VIEW - 4);
  b.strokeStyle = '#2c3444';
  b.lineWidth = 7;
  b.beginPath();
  b.moveTo(...project(-16, 16));
  b.lineTo(...project(-16, -14));
  b.moveTo(...project(16, 16));
  b.lineTo(...project(16, -14));
  b.moveTo(...project(0, 16));
  b.lineTo(...project(0, -12));
  b.stroke();
  const blocks = [
    [-22.3, -19, 0.6, 38], [22.3, -19, 0.6, 38],
    [-23, -18.3, 46, 0.6], [-23, 18.3, 46, 0.6],
    [-4, -7, 8, 6], [-10.3, -12, 0.6, 10], [9.7, -12, 0.6, 10],
    [-8, -12.8, 16, 0.6], [-19.3, -15, 0.6, 8], [-19, -15.3, 8, 0.6],
    [-19, -7.3, 6, 0.6], [-11.3, -15, 0.6, 3],
    [18.7, -15, 0.6, 8], [11, -15.3, 8, 0.6], [13, -7.3, 6, 0.6], [10.7, -15, 0.6, 3],
    [-21.5, 0.7, 4, 2.6], [-21.5, 7.2, 4, 2.6], [-20.3, -6.5, 2.6, 6],
    [17.5, 0.7, 4, 2.6], [17.5, 7.2, 4, 2.6], [17.7, -6.5, 2.6, 6],
    [-9, 5.2, 5, 2.6], [4, 5.2, 5, 2.6],
    [-19.8, -13.9, 4.4, 2.6], [15.6, -14.3, 4.4, 2.6],
    [14, -17.9, 5, 2.6],
  ];
  b.fillStyle = '#3d4554';
  for (const [x, z, w, d] of blocks) {
    const [px, py] = project(x, z);
    b.fillRect(px, py, w * SCALE, d * SCALE);
  }
  b.fillStyle = 'rgba(245, 166, 35, 0.28)';
  b.beginPath();
  b.arc(...project(-15, -11), 4 * SCALE, 0, Math.PI * 2);
  b.fill();
  b.fillStyle = 'rgba(57, 197, 216, 0.28)';
  b.beginPath();
  b.arc(...project(15, -11), 4 * SCALE, 0, Math.PI * 2);
  b.fill();
  b.fillStyle = '#f5a623';
  b.font = 'bold 13px system-ui, sans-serif';
  b.textAlign = 'center';
  b.fillText('A', ...project(-15, -11));
  b.fillStyle = '#39c5d8';
  b.fillText('B', ...project(15, -11));
  b.fillStyle = 'rgba(74, 163, 255, 0.8)';
  b.fillRect(...project(-4, 15), 7, 7);
  b.fillStyle = 'rgba(232, 83, 47, 0.8)';
  b.fillRect(...project(-4, -16), 7, 7);

  const enemyPings = new Map();
  return {
    pingEnemy(id, x, z, now) {
      enemyPings.set(id, { x, z, at: now });
    },
    draw(state, now) {
      ctx.clearRect(0, 0, VIEW, VIEW);
      ctx.drawImage(base, 0, 0);
      if (state.spike) {
        const [sx, sy] = project(state.spike.x, state.spike.z);
        const pulse = 3 + Math.sin(now * 6) * 1.5;
        ctx.strokeStyle = '#ff2e1f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, pulse + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ff2e1f';
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const mate of state.mates) {
        const [mx, my] = project(mate.x, mate.z);
        ctx.fillStyle = '#4aa3ff';
        ctx.beginPath();
        ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const [id, ping] of enemyPings) {
        if (now - ping.at > 1.6) {
          enemyPings.delete(id);
          continue;
        }
        const [ex, ey] = project(ping.x, ping.z);
        ctx.fillStyle = '#e8532f';
        ctx.beginPath();
        ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      const [px, py] = project(state.player.x, state.player.z);
      const yaw = state.player.yaw;
      ctx.fillStyle = 'rgba(233, 226, 210, 0.18)';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, 22, -yaw - 0.5 - Math.PI / 2, -yaw + 0.5 - Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-yaw);
      ctx.fillStyle = '#e9e2d2';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4.5, 5);
      ctx.lineTo(-4.5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#3d4554';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, VIEW - 2, VIEW - 2);
    },
  };
}
