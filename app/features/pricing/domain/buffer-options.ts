export const consultationBufferOptions = Array.from({ length: 25 }, (_, i) => ({
  label: i === 0 ? 'Pas de pause' : `${i * 5} min`,
  value: i * 5
}))
// [0, 5, 10, 15, 20, 25, 30, ..., 120]
