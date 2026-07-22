import { getAllClasses } from './account-store.js';

// Menginisialisasi tombol & panel Leaderboard Kelas (pojok kiri atas).
// Mengembalikan fungsi closeLeaderboard() supaya bisa ditutup dari luar jika perlu.
export function initLeaderboard() {
  const leaderboardBtn = document.getElementById('leaderboard-btn');
  const leaderboardPanel = document.getElementById('leaderboard-panel');
  const leaderboardList = document.getElementById('leaderboard-list');

  async function openLeaderboard() {
    leaderboardPanel.classList.add('show');
    leaderboardList.innerHTML = '<div class="lb-empty">Memuat...</div>';
    const classes = await getAllClasses();
    classes.sort((a, b) => (b.points || 0) - (a.points || 0));
    if (classes.length === 0) {
      leaderboardList.innerHTML = '<div class="lb-empty">Belum ada kelas yang terdaftar.</div>';
      return;
    }
    leaderboardList.innerHTML = classes.map((c, i) =>
      `<div class="lb-row"><div class="lb-rank">${i+1}</div><div class="lb-name">${c.name}</div><div class="lb-points">${c.points||0} pts</div></div>`
    ).join('');
  }

  function closeLeaderboard() {
    leaderboardPanel.classList.remove('show');
  }

  leaderboardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openLeaderboard();
  });

  document.addEventListener('click', (e) => {
    if (!leaderboardPanel.contains(e.target) && !leaderboardBtn.contains(e.target)) {
      closeLeaderboard();
    }
  });

  return { closeLeaderboard };
}
