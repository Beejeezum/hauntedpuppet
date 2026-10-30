/** Raster letters dissolve into small drifting pieces; no character face replacement. */
export class GhostLettering {
  constructor() { this.canvas = document.createElement('canvas'); this.canvas.width = 1040; this.canvas.height = 210; this.ctx = this.canvas.getContext('2d'); this.clear(); }
  clear() { this.active = false; this.text = ''; }
  show(text, form, clock, duration) {
    this.text = text; this.form = form; this.clock = clock; this.duration = duration; this.active = true;
    const ctx = this.ctx; ctx.clearRect(0, 0, 1040, 210); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = form === 'scary' ? '#d6cff2' : '#f9eedb';
    // Wrap by measured glyph width, including long unbroken words.
    let size = 38, lines;
    do {
      ctx.font = `italic ${size}px Georgia, serif`; lines = []; let line = '';
      for (const word of text.split(/\s+/)) {
        if (ctx.measureText(line + ' ' + word).width <= 960) { line += (line ? ' ' : '') + word; continue; }
        if (line) lines.push(line); line = '';
        for (const char of word) { if (ctx.measureText(line + char).width > 960) { lines.push(line); line = ''; } line += char; }
      }
      if (line) lines.push(line);
      if (lines.length * (size + 5) <= 190 || size <= 16) break;
      size -= 2;
    } while (true);
    lines.forEach((l, i, list) => ctx.fillText(l, 520, 105 + (i - (list.length - 1) / 2) * (size + 5), 960));
  }
  draw(ctx) {
    if (!this.active) return;
    const t = this.clock(), disperse = Math.max(0, (t - this.duration) / 1.8);
    if (t < 0) return;
    if (disperse >= 1) { this.clear(); return; }
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const enter = Math.min(1, t / .65), alpha = enter * (1 - disperse);
    // Soft halo follows the readable core. At the ending, fragments leave at varied speeds.
    ctx.shadowColor = this.form === 'scary' ? '#8983dc' : '#94cfd5'; ctx.shadowBlur = disperse ? 0 : 14;
    const y = 490 - Math.sin(t * .45) * 3;
    if (disperse === 0) { ctx.globalAlpha = alpha * .9; ctx.drawImage(this.canvas, 120, y); }
    else {
      for (let sy = 0; sy < 210; sy += 7) for (let sx = 0; sx < 1040; sx += 13) {
        const seed = ((sx * 17 + sy * 43) % 101) / 100, drift = disperse * disperse;
        ctx.globalAlpha = alpha * (1 - disperse * seed);
        ctx.drawImage(this.canvas, sx, sy, 13, 7, 120 + sx + Math.sin(seed * 9 + disperse * 3) * drift * 35, y + sy - drift * (16 + seed * 70), 13 + drift * 6, 7 + drift * 3);
      }
    }
    ctx.restore();
  }
  dispose() { this.clear(); this.canvas.width = this.canvas.height = 0; }
}
