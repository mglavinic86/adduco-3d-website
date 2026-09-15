/** Native scroll is the shared clock for both HTML captions and the 3D camera. */
export function journeyProgress() {
  const first = document.getElementById("vizija");
  const next = document.getElementById("povjerenje");
  const distance = first && next ? next.offsetTop - first.offsetTop : 0;
  return distance > 0
    ? Math.max(0, Math.min(3, (scrollY - first!.offsetTop) / distance))
    : 0;
}
