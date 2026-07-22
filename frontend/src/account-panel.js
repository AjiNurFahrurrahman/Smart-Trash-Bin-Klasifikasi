import {
  getAllClasses, createClass, addPointsToClass,
  getMyAccount, setMyAccount, clearMyAccount
} from './account-store.js';

// Menginisialisasi tombol & panel "Kelas & Akun" (pojok kanan atas): buat akun di
// kelas yang sudah ada, atau buat kelas baru sekaligus akunnya.
// Mengembalikan { getActiveAccount, awardPointsForCategory } untuk dipakai main.js
// saat menambahkan poin setelah AI berhasil mengklasifikasi sampah.
export function initAccountPanel() {
  const classBtn = document.getElementById('class-btn');
  const classPanel = document.getElementById('class-panel');
  const hasAccountView = document.getElementById('has-account-view');
  const noAccountView = document.getElementById('no-account-view');
  const currentAccountName = document.getElementById('current-account-name');
  const currentClassName = document.getElementById('current-class-name');
  const switchClassBtn = document.getElementById('switch-class-btn');
  const joinClassSelect = document.getElementById('join-class-select');
  const joinAccountName = document.getElementById('join-account-name');
  const joinSubmitBtn = document.getElementById('join-submit-btn');
  const createClassNameInput = document.getElementById('create-class-name');
  const createAccountNameInput = document.getElementById('create-account-name');
  const createSubmitBtn = document.getElementById('create-submit-btn');
  const classErrorMsg = document.getElementById('class-error-msg');

  let myAccount = null; // { accountName, classSlug, className }

  async function refreshClassOptions() {
    const classes = await getAllClasses();
    joinClassSelect.innerHTML = '<option value="">-- pilih kelas --</option>' +
      classes.map(c => `<option value="${c.slug}" data-name="${c.name}">${c.name}</option>`).join('');
  }

  function showAccountView() {
    hasAccountView.style.display = 'block';
    noAccountView.style.display = 'none';
    currentAccountName.textContent = myAccount.accountName;
    currentClassName.textContent = myAccount.className;
  }

  async function showNoAccountView() {
    hasAccountView.style.display = 'none';
    noAccountView.style.display = 'block';
    await refreshClassOptions();
  }

  function closeClassPanel() {
    classPanel.classList.remove('show');
  }

  classBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    classPanel.classList.add('show');
    classErrorMsg.style.display = 'none';
    myAccount = await getMyAccount();
    if (myAccount) showAccountView();
    else await showNoAccountView();
  });

  document.querySelectorAll('.close-x').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById(el.dataset.close).classList.remove('show');
    });
  });

  document.querySelectorAll('.class-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.class-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.class-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('form-' + tab.dataset.tab).classList.add('active');
      classErrorMsg.style.display = 'none';
    });
  });

  joinSubmitBtn.addEventListener('click', async () => {
    classErrorMsg.style.display = 'none';
    const slug = joinClassSelect.value;
    const name = joinAccountName.value.trim();
    if (!slug) { classErrorMsg.textContent = 'Pilih kelas dulu.'; classErrorMsg.style.display = 'block'; return; }
    if (!name) { classErrorMsg.textContent = 'Isi nama akunmu dulu.'; classErrorMsg.style.display = 'block'; return; }
    const className = joinClassSelect.selectedOptions[0].dataset.name;
    myAccount = await setMyAccount(name, slug, className);
    closeClassPanel();
  });

  createSubmitBtn.addEventListener('click', async () => {
    classErrorMsg.style.display = 'none';
    const className = createClassNameInput.value.trim();
    const accName = createAccountNameInput.value.trim();
    if (!className) { classErrorMsg.textContent = 'Isi nama kelas dulu.'; classErrorMsg.style.display = 'block'; return; }
    if (!accName) { classErrorMsg.textContent = 'Isi nama akunmu dulu.'; classErrorMsg.style.display = 'block'; return; }
    try {
      const cls = await createClass(className);
      myAccount = await setMyAccount(accName, cls.slug, cls.name);
      closeClassPanel();
    } catch (err) {
      classErrorMsg.textContent = err.message;
      classErrorMsg.style.display = 'block';
    }
  });

  switchClassBtn.addEventListener('click', async () => {
    await clearMyAccount();
    myAccount = null;
    await showNoAccountView();
  });

  // muat akun tersimpan saat halaman dibuka, supaya poin bisa langsung ditambahkan
  // tanpa perlu user membuka panel dulu
  getMyAccount().then(acc => { myAccount = acc; });

  document.addEventListener('click', (e) => {
    if (!classPanel.contains(e.target) && !classBtn.contains(e.target)) {
      closeClassPanel();
    }
  });

  return {
    getActiveAccount: () => myAccount,
    async awardPointsForCategory(category) {
      if (myAccount && myAccount.classSlug) {
        await addPointsToClass(myAccount.classSlug, category);
      }
    }
  };
}
