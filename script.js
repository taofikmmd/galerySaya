document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const uploadForm = document.getElementById('uploadForm');
    const gallery = document.getElementById('gallery');

    // Kunci untuk menyimpan data di Local Storage
    const STORAGE_KEY = 'designSayaPhotos';

    // --- FUNGSI UTAMA ---

    /**
     * Memuat data foto dari localStorage.
     * @returns {Array} Daftar foto yang tersimpan atau array kosong.
     */
    function loadPhotos() {
        const storedPhotos = localStorage.getItem(STORAGE_KEY);
        // Mengembalikan array kosong jika belum ada data
        return storedPhotos ? JSON.parse(storedPhotos) : [];
    }

    /**
     * Menyimpan array foto ke localStorage.
     * @param {Array} photos Array foto yang akan disimpan.
     */
    function savePhotos(photos) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    }

    /**
     * Menambahkan foto ke galeri (DOM) dan menyimpannya ke localStorage.
     * @param {string} title Judul foto.
     * @param {string} imageUrl Data URL foto.
     */
    function addPhotoToGallery(title, imageUrl) {
        // 1. Tambahkan ke DOM (tampilan)
        const card = createPhotoCard(title, imageUrl);
        gallery.prepend(card);

        // 2. Tambahkan ke Local Storage
        const photos = loadPhotos();
        const newPhoto = {
            title: title,
            imageUrl: imageUrl, // Data URL disimpan di sini
            timestamp: Date.now()
        };

        photos.unshift(newPhoto); // Tambahkan di awal
        savePhotos(photos);
    }

    /**
     * Membuat elemen card foto untuk ditampilkan di galeri.
     * @param {string} title Judul foto.
     * @param {string} imageUrl Data URL foto.
     * @returns {HTMLElement} Elemen div card foto.
     */
    function createPhotoCard(title, imageUrl) {
        const card = document.createElement('div');
        card.className = 'image-card bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl cursor-pointer fade-in';

        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = title;
        image.className = 'w-full h-48 object-cover';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'p-4';

        const titleElement = document.createElement('h3');
        titleElement.className = 'text-lg font-semibold text-gray-800 truncate mb-2';
        titleElement.textContent = title;

        const downloadLink = document.createElement('a');
        downloadLink.href = imageUrl;
        downloadLink.download = `${title.replace(/ /g, '_')}_design.png`;
        downloadLink.className = 'block w-full text-center bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 rounded-lg transition duration-300 mt-3';
        downloadLink.textContent = '⬇️ Unduh Gambar';

        contentDiv.appendChild(titleElement);
        contentDiv.appendChild(downloadLink);

        card.appendChild(image);
        card.appendChild(contentDiv);

        return card;
    }

    /**
     * Inisialisasi: Memuat foto yang sudah ada dari localStorage saat halaman dimuat.
     */
    function initializeGallery() {
        const photos = loadPhotos();
        // Tampilkan foto-foto lama
        photos.forEach(photo => {
            const card = createPhotoCard(photo.title, photo.imageUrl);
            gallery.appendChild(card); // Gunakan appendChild untuk urutan dari yang paling lama
        });

        // Catatan: Jika ingin yang terbaru selalu di atas, gunakan gallery.prepend(card)
        // dan ubah loop di atas menjadi: photos.reverse().forEach(...)
    }

    // --- EVENT LISTENERS ---

    // 1. Tampil/Sembunyi Modal
    uploadBtn.addEventListener('click', () => {
        uploadModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        uploadModal.classList.add('hidden');
    });

    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.classList.add('hidden');
        }
    });

    // 2. Logika Unggah Foto
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const titleInput = document.getElementById('photoTitle');
        const fileInput = document.getElementById('photoFile');

        const title = titleInput.value;
        const file = fileInput.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = (event) => {
                const imageUrl = event.target.result;

                // Tambahkan foto ke DOM dan Local Storage
                addPhotoToGallery(title, imageUrl);

                // Reset form dan sembunyikan modal
                uploadForm.reset();
                uploadModal.classList.add('hidden');
            };

            // Membaca file gambar sebagai Data URL (string Base64)
            reader.readAsDataURL(file);
        }
    });

    // Panggil fungsi inisialisasi
    initializeGallery();
});