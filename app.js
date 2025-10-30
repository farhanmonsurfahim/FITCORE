import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, deleteDoc, onSnapshot, query, where, setDoc, getDoc, orderBy, limit, updateDoc, writeBatch, arrayUnion, arrayRemove, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// =======================================================
// FIREBASE CONFIGURATION
// Replace your Firebase info here with your actual project credentials.

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "paste here",
    authDomain: "paste here",
    projectId: "paste here",
    storageBucket: "paste here",
    messagingSenderId: "paste here",
    appId: "paste here"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let currentAdminSecret = '';
let allNotices = [];
let allDonors = [];
let membershipFields = [];
let allPackages = [];
let allMembers = [];
let allPayments = [];

const populateDropdowns = () => {
    // This function is kept for potential future use.
};

const showToast = (message, success = true) => {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.className = `fixed bottom-5 right-5 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 z-50 ${success ? 'bg-green-600' : 'bg-red-600'} opacity-100 translate-y-0`;
    setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-4'); }, 3000);
};

const showPage = (pageId, push = true) => {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const newPage = document.getElementById(pageId);
    if (!newPage) { showPage('home', push); return; }
    newPage.classList.add('active');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    newPage.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    window.scrollTo(0, 0);
    if (push) {
        const newUrl = pageId === 'home' ? '#' : `#${pageId}`;
        history.pushState({ page: pageId }, '', newUrl);
    }
};

const createAdminDeleteItem = (id, text, subText = '') => {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between bg-gray-100 p-2 rounded-lg';
    div.innerHTML = `<div class="truncate pr-2"><p class="font-medium truncate">${text}</p>${subText ? `<p class="text-sm text-gray-500 truncate">${subText}</p>` : ''}</div><button data-id="${id}" class="delete-btn text-red-500 hover:text-red-700 p-1 flex-shrink-0 rounded-full hover:bg-red-100 transition"><i data-lucide="trash-2" class="w-5 h-5"></i></button>`;
    return div;
};

const toggleButtonLoading = (form, isLoading, buttonSelector = 'button[type="submit"]') => {
    const button = form.querySelector(buttonSelector);
    if (!button) return;
    const btnText = button.querySelector('.btn-text');
    const loader = button.querySelector('.loader, .admin-loader');
    if (isLoading) {
        button.disabled = true;
        if (btnText) btnText.classList.add('hidden');
        if (loader) loader.classList.remove('hidden');
    } else {
        button.disabled = false;
        if (btnText) btnText.classList.remove('hidden');
        if (loader) loader.classList.add('hidden');
    }
};

const confirmModalBackdrop = document.getElementById('confirm-modal-backdrop');
const confirmModal = document.getElementById('confirm-modal');
const confirmBtn = document.getElementById('confirm-modal-confirm');
const cancelBtn = document.getElementById('confirm-modal-cancel');
const confirmModalMessage = document.getElementById('confirm-modal-message');
let confirmCallback = null;
const showConfirmModal = (message, onConfirm) => {
    confirmModalMessage.textContent = message;
    confirmCallback = onConfirm;
    confirmModalBackdrop.style.display = 'block';
    confirmModal.style.display = 'block';
};
const hideConfirmModal = () => {
    confirmModalBackdrop.style.display = 'none';
    confirmModal.style.display = 'none';
    confirmCallback = null;
};
confirmBtn.addEventListener('click', () => { if (confirmCallback) confirmCallback(); hideConfirmModal(); });
[cancelBtn, confirmModalBackdrop].forEach(el => el.addEventListener('click', hideConfirmModal));

const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuBtn = document.getElementById('mobile-menu-button');
const mobileMenuIcons = mobileMenuBtn.querySelectorAll('i');
const closeMobileMenu = () => {
    mobileMenu.classList.add('hidden');
    mobileMenuIcons[0].classList.remove('hidden');
    mobileMenuIcons[1].classList.add('hidden');
};
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(e.currentTarget.dataset.page);
        closeMobileMenu();
    });
});
mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    mobileMenuIcons.forEach(i => i.classList.toggle('hidden'));
});

const renderMembershipFields = (fields) => {
    const publicContainer = document.getElementById('additional-fields-container');
    const adminContainer = document.getElementById('admin-additional-fields-container');
    const adminListContainer = document.getElementById('membership-fields-list');

    publicContainer.innerHTML = '';
    adminContainer.innerHTML = '';
    adminListContainer.innerHTML = '';

    fields.forEach(field => {
        const publicInput = document.createElement('input');
        publicInput.type = 'text';
        publicInput.placeholder = field;
        publicInput.dataset.fieldName = field;
        publicInput.className = 'w-full px-4 py-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-accent transition';
        publicContainer.appendChild(publicInput);
        
        const adminInput = document.createElement('input');
        adminInput.type = 'text';
        adminInput.placeholder = field;
        adminInput.dataset.fieldName = field;
        adminInput.className = 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent transition';
        adminContainer.appendChild(adminInput);
        
        const listItem = document.createElement('div');
        listItem.className = 'flex items-center justify-between bg-gray-100 p-2 rounded-lg';
        listItem.innerHTML = `<p class="font-medium">${field}</p><button data-field-name="${field}" class="delete-field-btn text-red-500 hover:text-red-700 p-1 flex-shrink-0 rounded-full hover:bg-red-100 transition"><i data-lucide="trash-2" class="w-5 h-5"></i></button>`;
        adminListContainer.appendChild(listItem);
    });
    lucide.createIcons();
};

const fetchSettings = async () => {
    const settingsDocRef = doc(db, `artifacts/${appId}/public/data/settings`, 'config');
    onSnapshot(settingsDocRef, (settingsSnap) => {
           if (settingsSnap.exists()) {
                const settings = settingsSnap.data();
                currentAdminSecret = settings.adminId;
                
                const websiteTitle = settings.websiteTitle || 'NUB Evening Society';
                const logoUrl = settings.logoUrl || 'https://placehold.co/32x32/4f46e5/ffffff?text=N';
                document.title = websiteTitle;
                document.getElementById('header-title').textContent = websiteTitle;
                const headerLogo = document.getElementById('header-logo');
                headerLogo.src = logoUrl;
                headerLogo.onerror = () => { headerLogo.src = 'https://placehold.co/32x32/4f46e5/ffffff?text=N'; };

                document.getElementById('website-title').value = websiteTitle;
                document.getElementById('website-logo-url').value = logoUrl;
                document.getElementById('facebook-link').value = settings.facebookLink || '';
                document.getElementById('whatsapp-link').value = settings.whatsappLink || '';
                document.getElementById('footer-fb-link').href = settings.facebookLink || '#';
                document.getElementById('footer-wa-link').href = settings.whatsappLink || '#';

                membershipFields = settings.membershipFields || [];
                renderMembershipFields(membershipFields);
            } else {
                currentAdminSecret = 'admin123';
                 setDoc(settingsDocRef, { 
                     adminId: "admin123", 
                     websiteTitle: "NUB Evening Society",
                     logoUrl: "https://placehold.co/32x32/4f46e5/ffffff?text=N",
                     facebookLink: "https://facebook.com", 
                     whatsappLink: "https://whatsapp.com", 
                     membershipFields: [] 
                });
            }
        }, (error) => {
            console.error("Error fetching settings:", error); showToast("Could not load app settings.", false);
        });
};

const renderLatestNotices = (notices) => {
    const list = document.getElementById('latest-notices-list');
    list.innerHTML = '';
    if (notices.length === 0) { list.innerHTML = '<p class="text-center text-gray-500 py-4">No notices posted yet.</p>'; return; }
    notices.forEach(notice => {
        const item = document.createElement('a');
        item.href = `#notices`;
        item.dataset.noticeId = notice.id;
        item.className = 'latest-notice-link block p-4 border rounded-xl hover:bg-gray-50 hover:shadow-md transition cursor-pointer';
        item.innerHTML = `<h4 class="font-semibold truncate text-gray-800">${notice.data.title}</h4><p class="text-sm text-gray-500">Posted on: ${new Date(notice.data.createdAt.seconds * 1000).toLocaleDateString()}</p>`;
        list.appendChild(item);
    });
};

const renderPackages = (packages) => {
    allPackages = packages;
    const pricingSection = document.getElementById('pricing-section');
    const membershipSelection = document.getElementById('membership-package-selection');
    const adminPackageSelect = document.getElementById('add-member-package');
    const adminPackagesList = document.getElementById('admin-packages-list');

    pricingSection.innerHTML = '';
    membershipSelection.innerHTML = '';
    adminPackageSelect.innerHTML = '<option value="">Select a Package</option>';
    adminPackagesList.innerHTML = '';

    if (packages.length === 0) {
        pricingSection.innerHTML = `<p class="text-center text-gray-500 col-span-full">No membership packages available at the moment.</p>`;
    }

    packages.forEach((pkg, index) => {
        const priceCard = document.createElement('div');
        priceCard.className = 'bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent transition-all hover:border-primary hover:shadow-2xl flex flex-col';
        priceCard.innerHTML = `
            <h3 class="text-2xl font-bold text-gray-900">${pkg.name}</h3>
            <div class="my-4">
                <span class="text-4xl font-extrabold text-gray-900">$${pkg.monthlyPrice}</span>
                <span class="text-base font-medium text-gray-500">/month</span>
            </div>
            <ul class="mt-8 space-y-4 text-left flex-grow">
                ${pkg.features.map(feature => `<li class="flex items-start gap-3"><i data-lucide="check-circle" class="w-5 h-5 text-green-500 mt-1 flex-shrink-0"></i><span class="text-gray-700">${feature}</span></li>`).join('')}
            </ul>
            <a href="#" data-page="membership" class="nav-link mt-8 block w-full text-center bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-dark transition-colors">Choose Plan</a>
        `;
        pricingSection.appendChild(priceCard);

        const radioWrapper = document.createElement('div');
        radioWrapper.className = 'flex items-center p-3 border rounded-lg hover:bg-gray-50';
        radioWrapper.innerHTML = `
            <input type="radio" id="pkg-req-${pkg.id}" name="membership-package" value="${pkg.id}|${pkg.name}" class="h-4 w-4 text-primary focus:ring-primary border-gray-300" ${index === 0 ? 'checked' : ''}>
            <label for="pkg-req-${pkg.id}" class="ml-3 block text-sm font-medium text-gray-700">
                <span class="font-bold">${pkg.name}</span> - $${pkg.monthlyPrice}/mo
            </label>
        `;
        membershipSelection.appendChild(radioWrapper);

        const option = document.createElement('option');
        option.value = `${pkg.id}|${pkg.name}`;
        option.textContent = `${pkg.name} ($${pkg.monthlyPrice}/mo)`;
        adminPackageSelect.appendChild(option);

        const adminItem = createAdminDeleteItem(pkg.id, pkg.name, `$${pkg.monthlyPrice}/mo`);
        adminItem.querySelector('.delete-btn').dataset.collection = 'packages';
        adminPackagesList.appendChild(adminItem);
    });
    lucide.createIcons();
    renderDashboardAndDues();
};

const renderBloodDonors = (donors) => {
    allDonors = donors;
    const list = document.getElementById('donors-list');
    const adminList = document.getElementById('admin-donors-list');
    list.innerHTML = ''; 
    adminList.innerHTML = '';
    
    const groupFilter = document.getElementById('blood-group-filter').value;

    const filteredDonors = allDonors.filter(donor => {
        const groupMatch = !groupFilter || donor.bloodGroup === groupFilter;
        return groupMatch;
    });

    if (filteredDonors.length === 0) {
        list.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-gray-500">No donors found for this filter.</td></tr>`;
    } else {
        filteredDonors.forEach(donor => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${donor.name}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">${donor.bloodGroup}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${donor.contact}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${donor.address}</td>`;
            list.appendChild(tr);
        });
    }
    
    allDonors.forEach(donor => {
        const adminItem = createAdminDeleteItem(donor.id, donor.name, `${donor.bloodGroup} - ${donor.contact}`);
        adminItem.querySelector('.delete-btn').dataset.collection = 'donors';
        adminList.appendChild(adminItem);
    });

    lucide.createIcons();
};

const renderNotices = (noticeData) => {
    allNotices = noticeData;
    const list = document.getElementById('notices-list');
    const adminList = document.getElementById('admin-notices-list');
    list.innerHTML = ''; 
    adminList.innerHTML = '';
    const searchTerm = document.getElementById('notice-search').value.toLowerCase();
    const filteredNotices = allNotices.filter(notice => (notice.data.title.toLowerCase().includes(searchTerm) || notice.data.description.toLowerCase().includes(searchTerm)));
    if (filteredNotices.length === 0) list.innerHTML = '<p class="text-center text-gray-500">No notices found.</p>';
    filteredNotices.forEach(notice => {
        const date = new Date(notice.data.createdAt.seconds * 1000).toLocaleDateString();
        const card = document.createElement('div');
        card.id = `notice-${notice.id}`;
        card.className = 'p-6 border rounded-xl shadow-sm bg-white notice-card transition-all';
        card.innerHTML = `<h3 class="text-2xl font-bold mb-3 text-gray-900 notice-title">${notice.data.title}</h3>${notice.data.imageDataUrl ? `<img src="${notice.data.imageDataUrl}" alt="${notice.data.title}" class="w-full h-auto max-h-96 object-contain rounded-lg mb-4 bg-gray-100" onerror="this.style.display='none'">` : ''}<p class="text-gray-700 whitespace-pre-wrap mb-4 notice-description">${notice.data.description}</p><p class="text-sm text-gray-500">Posted on: ${date}</p>`;
        list.appendChild(card);
    });
    allNotices.forEach(notice => {
        const date = new Date(notice.data.createdAt.seconds * 1000).toLocaleDateString();
        const adminItem = createAdminDeleteItem(notice.id, notice.data.title, `Posted on ${date}`);
        adminItem.querySelector('.delete-btn').dataset.collection = 'notices';
        adminList.appendChild(adminItem);
    });
    lucide.createIcons();
};

const renderTeam = (allData) => {
    const list = document.getElementById('team-list');
    const adminList = document.getElementById('admin-team-list');
    list.innerHTML = '';
    adminList.innerHTML = '';
    allData.forEach(member => {
        const card = document.createElement('div');
        card.className = 'text-center bg-white p-6 rounded-2xl shadow-sm transition-transform transform hover:-translate-y-2';
        card.innerHTML = `<img src="${member.data.imageDataUrl}" alt="${member.data.name}" class="w-32 h-32 mx-auto rounded-full object-cover shadow-lg mb-4 ring-4 ring-primary-light" onerror="this.src='https://placehold.co/128x128/E0E7FF/4F46E5?text=${member.data.name.charAt(0)}'"><h4 class="text-xl font-bold text-gray-900">${member.data.name}</h4><p class="text-primary font-semibold">${member.data.title}</p>`;
        list.appendChild(card);
        const adminItem = createAdminDeleteItem(member.id, member.data.name, member.data.title);
        adminItem.querySelector('.delete-btn').dataset.collection = 'team';
        adminList.appendChild(adminItem);
    });
    lucide.createIcons();
};

const createAdminRequestItem = (id, text, subText) => {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between bg-yellow-50 p-2 rounded-lg';
    div.innerHTML = `
        <div>
            <p class="font-medium truncate">${text}</p>
            <p class="text-sm text-gray-500 truncate">${subText}</p>
        </div>
        <div class="flex gap-2">
            <button data-id="${id}" class="approve-request-btn text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 transition"><i data-lucide="check-circle" class="w-5 h-5"></i></button>
            <button data-id="${id}" data-collection="requests" class="delete-btn text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
        </div>`;
    return div;
};

const renderRequests = (requests) => {
    const list = document.getElementById('admin-requests-list');
    list.innerHTML = requests.length === 0 ? '<p class="text-sm text-gray-500">No pending requests.</p>' : '';
    requests.forEach(req => { 
        const subtext = `Package: ${req.packageName || 'N/A'} - Phone: ${req.phone}`;
        const item = createAdminRequestItem(req.id, req.name, subtext);
        list.appendChild(item);
       });
    lucide.createIcons();
};

const renderDashboardAndDues = () => {
    const memberSelect = document.getElementById('payment-member-select');
    const duesList = document.getElementById('members-dues-list');
    memberSelect.innerHTML = '<option value="">Select Member</option>';
    duesList.innerHTML = '';
    let grandTotalPaid = 0;
    let grandTotalDue = 0;

    allMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = `${member.id}|${member.name}`;
        option.textContent = member.name;
        memberSelect.appendChild(option);
        
        const memberPackage = allPackages.find(p => p.id === member.packageId);
        let totalDue = 0;
        if (memberPackage && member.joinDate) {
            const joinDate = member.joinDate.toDate();
            const now = new Date();
            const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth()) + 1;
            const totalBillable = Math.max(1, months) * memberPackage.monthlyPrice;
            totalDue = totalBillable - (member.totalPaid || 0);
        }

        grandTotalPaid += (member.totalPaid || 0);
        grandTotalDue += totalDue;
        
        const status = totalDue <= 0 
            ? '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span>'
            : '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Due</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${member.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.packageName || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${member.joinDate ? member.joinDate.toDate().toLocaleDateString() : 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${(member.totalPaid || 0).toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold ${totalDue > 0 ? 'text-red-600' : 'text-green-600'}">$${totalDue.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${status}</td>
        `;
        duesList.appendChild(tr);
    });
    document.getElementById('total-paid-stat').textContent = `$${grandTotalPaid.toFixed(2)}`;
    document.getElementById('total-due-stat').textContent = `$${grandTotalDue.toFixed(2)}`;
};

const setupListeners = () => {
    onSnapshot(collection(db, `artifacts/${appId}/public/data/donors`), s => renderBloodDonors(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(query(collection(db, `artifacts/${appId}/public/data/notices`), orderBy('createdAt', 'desc')), s => renderNotices(s.docs.map(d => ({id: d.id, data: d.data()}))));
    onSnapshot(collection(db, `artifacts/${appId}/public/data/team`), s => renderTeam(s.docs.map(d => ({id: d.id, data: d.data()}))));
    onSnapshot(collection(db, `artifacts/${appId}/public/data/requests`), s => renderRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, `artifacts/${appId}/public/data/packages`), s => renderPackages(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, `artifacts/${appId}/public/data/members`), s => {
        allMembers = s.docs.map(d => ({ id: d.id, ...d.data() }));
        renderDashboardAndDues();
    });
    onSnapshot(collection(db, `artifacts/${appId}/public/data/payments`), s => {
        allPayments = s.docs.map(d => ({ id: d.id, ...d.data() }));
        renderDashboardAndDues();
    });

    onSnapshot(query(collection(db, `artifacts/${appId}/public/data/notices`), orderBy('createdAt', 'desc'), limit(3)), s => renderLatestNotices(s.docs.map(d => ({id: d.id, data: d.data()}))));
    onSnapshot(doc(db, `artifacts/${appId}/public/data/gallery`, "images"), doc => {
        if (doc.exists()) {
            renderGallerySlider(doc.data());
            renderAdminGalleryPreviews(doc.data());
        }
    });
};

const initializeAppData = async () => {
    await fetchSettings();
    setupListeners();
};

let appInitialized = false;
onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (!appInitialized) {
            appInitialized = true;
            await initializeAppData();
        }
    }
});

const authenticateUser = async () => {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    } catch (e) {
        console.error("Authentication failed", e);
        showToast("Authentication failed. Please refresh.", false);
    }
};

document.getElementById('blood-group-filter').addEventListener('input', () => renderBloodDonors(allDonors));

document.getElementById('notice-search').addEventListener('input', () => renderNotices(allNotices));

const handleFormSubmit = (formId, collectionName, dataExtractor) => {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        toggleButtonLoading(form, true);
        try {
            const data = dataExtractor(e.target);
            if(!data) { toggleButtonLoading(form, false); return; }
            await addDoc(collection(db, `artifacts/${appId}/public/data/${collectionName}`), data);
            showToast("Submitted successfully!"); e.target.reset();
        } catch (error) { showToast("Submission failed.", false); console.error(error); } 
        finally { toggleButtonLoading(form, false); }
    });
};

handleFormSubmit('add-donor-form', 'donors', f => ({ name: f['donor-name'].value, bloodGroup: f['blood-group'].value, contact: f['donor-contact'].value, address: f['donor-address'].value }));
handleFormSubmit('add-package-form', 'packages', f => {
    const features = f['package-features'].value.split('\n').map(line => line.trim()).filter(line => line);
    return {
        name: f['package-name'].value,
        monthlyPrice: parseFloat(f['package-monthly'].value),
        features: features
    };
});

const memberDataExtractor = (form, isAdmin = false) => {
    const prefix = isAdmin ? 'add-member-' : 'req-';
    const containerId = isAdmin ? 'admin-additional-fields-container' : 'additional-fields-container';
    
    let packageId = null;
    let packageName = null;
    if (isAdmin) {
        const selectedPackage = form[`${prefix}package`].value;
        if (selectedPackage) {
            [packageId, packageName] = selectedPackage.split('|');
        }
    } else {
        const selectedRadio = form.querySelector('input[name="membership-package"]:checked');
        if (selectedRadio) {
            [packageId, packageName] = selectedRadio.value.split('|');
        }
    }

    if (!packageId) {
        showToast("Please select a package.", false);
        return null;
    }

    const data = {
        name: form[`${prefix}name`].value,
        phone: form[`${prefix}phone`].value,
        address: form[`${prefix}address`].value,
        packageId: packageId,
        packageName: packageName,
        additionalData: {}
    };

    const additionalFieldsContainer = document.getElementById(containerId);
    additionalFieldsContainer.querySelectorAll('input').forEach(input => {
        const fieldName = input.dataset.fieldName;
        if (fieldName) data.additionalData[fieldName] = input.value;
    });
    return data;
};

handleFormSubmit('membership-request-form', 'requests', f => memberDataExtractor(f, false));

document.getElementById('add-member-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    toggleButtonLoading(form, true);
    try {
        const data = memberDataExtractor(form, true);
        if (data) {
            data.joinDate = new Date();
            data.totalPaid = 0;
            await addDoc(collection(db, `artifacts/${appId}/public/data/members`), data);
            showToast("Member added successfully!");
            form.reset();
        }
    } catch (error) {
        showToast("Failed to add member.", false);
        console.error(error);
    } finally {
        toggleButtonLoading(form, false);
    }
});

['admin-link', 'admin-link-mobile'].forEach(id => document.getElementById(id).addEventListener('click', e => { 
    e.preventDefault();
    showPage('admin-login');
}));

document.getElementById('admin-login-form').addEventListener('submit', async e => {
    e.preventDefault(); const form = e.target; toggleButtonLoading(form, true);
    await new Promise(res => setTimeout(res, 500));
    if (document.getElementById('admin-secret-id').value === currentAdminSecret) {
        showToast("Admin access granted."); showPage('admin');
    } else { showToast("Incorrect secret ID.", false); }
    toggleButtonLoading(form, false);
});

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const form = e.target; toggleButtonLoading(form, true);
    const newSecretId = form['admin-secret-id-change'].value;

    const settings = { 
        websiteTitle: form['website-title'].value,
        logoUrl: form['website-logo-url'].value,
        facebookLink: form['facebook-link'].value, 
        whatsappLink: form['whatsapp-link'].value 
    };

    if (newSecretId) {
        settings.adminId = newSecretId;
    }

    try {
        await setDoc(doc(db, `artifacts/${appId}/public/data/settings`, "config"), settings, { merge: true });
        showToast("Settings saved.");
        form['admin-secret-id-change'].value = '';
    } catch (error) { showToast("Failed to save settings.", false); console.error(error); } 
    finally { toggleButtonLoading(form, false); }
});

document.getElementById('add-membership-field-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const fieldName = form['new-field-name'].value;
    if (!fieldName.trim()) {
        showToast("Field name cannot be empty.", false);
        return;
    }
    toggleButtonLoading(form, true);
    try {
        const settingsRef = doc(db, `artifacts/${appId}/public/data/settings`, 'config');
        await updateDoc(settingsRef, {
            membershipFields: arrayUnion(fieldName)
        });
        showToast("Field added successfully.");
        form.reset();
    } catch (error) {
        console.error("Error adding field:", error);
        showToast("Failed to add field.", false);
    } finally {
        toggleButtonLoading(form, false);
    }
});

const handleFormWithImageUpload = (formId, collectionName, dataExtractor) => {
    const form = document.getElementById(formId);
    form.addEventListener('submit', e => {
        e.preventDefault(); toggleButtonLoading(form, true);
        try {
            const { file, data } = dataExtractor(form);
            if (file) {
                if (file.size > 750 * 1024) { showToast("Image is too large (under 750 KB).", false); toggleButtonLoading(form, false); return; }
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        data.imageDataUrl = event.target.result;
                        await addDoc(collection(db, `artifacts/${appId}/public/data/${collectionName}`), data);
                        showToast("Item added successfully."); form.reset();
                    } catch (error) { console.error(error); showToast("Failed to save item.", false); } 
                    finally { toggleButtonLoading(form, false); }
                };
                reader.onerror = () => { showToast("Failed to read image file.", false); toggleButtonLoading(form, false); };
                reader.readAsDataURL(file);
            } else {
                addDoc(collection(db, `artifacts/${appId}/public/data/${collectionName}`), data)
                    .then(() => { showToast("Item added successfully."); form.reset(); })
                    .catch(error => { showToast("Failed to add item.", false); console.error(error); })
                    .finally(() => toggleButtonLoading(form, false));
            }
        } catch (error) { showToast("An unexpected error occurred.", false); console.error(error); toggleButtonLoading(form, false); }
    });
};
handleFormWithImageUpload('add-notice-form', 'notices', f => ({ file: f['notice-image-upload'].files[0], data: { title: f['notice-title'].value, description: f['notice-desc'].value, createdAt: new Date(), imageDataUrl: null } }));
handleFormWithImageUpload('add-team-member-form', 'team', f => ({ file: f['member-image-upload'].files[0], data: { name: f['member-name'].value, title: f['member-title'].value, imageDataUrl: null } }));

document.body.addEventListener('click', async e => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
        const { id, collection: collectionName } = deleteBtn.dataset;
        showConfirmModal("Are you sure? This cannot be undone.", async () => {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/public/data/${collectionName}`, id)); showToast("Item deleted.");
            } catch (error) { showToast("Failed to delete item.", false); console.error(error); }
        });
    }

    const approveBtn = e.target.closest('.approve-request-btn');
    if (approveBtn) {
        const requestId = approveBtn.dataset.id;
        showConfirmModal("Are you sure you want to approve this member?", async () => {
            try {
                const requestRef = doc(db, `artifacts/${appId}/public/data/requests`, requestId);
                const requestSnap = await getDoc(requestRef);
                if (requestSnap.exists()) {
                    const requestData = requestSnap.data();
                    const newMemberData = {
                        ...requestData,
                        joinDate: new Date(),
                        totalPaid: 0
                    };
                    await addDoc(collection(db, `artifacts/${appId}/public/data/members`), newMemberData);
                    await deleteDoc(requestRef);
                    showToast("Member approved successfully!");
                } else {
                    showToast("Request not found.", false);
                }
            } catch (error) {
                console.error("Error approving member:", error);
                showToast("Failed to approve member.", false);
            }
        });
    }

    const deleteFieldBtn = e.target.closest('.delete-field-btn');
    if(deleteFieldBtn) {
        const fieldName = deleteFieldBtn.dataset.fieldName;
        showConfirmModal(`Delete the "${fieldName}" field? This action cannot be undone.`, async () => {
             try {
                const settingsRef = doc(db, `artifacts/${appId}/public/data/settings`, 'config');
                await updateDoc(settingsRef, {
                    membershipFields: arrayRemove(fieldName)
                });
                showToast("Field deleted successfully.");
            } catch (error) {
                console.error("Error deleting field:", error);
                showToast("Failed to delete field.", false);
            }
        });
    }

    const latestNoticeLink = e.target.closest('.latest-notice-link');
    if (latestNoticeLink) {
        e.preventDefault();
        showPage('notices');
        setTimeout(() => {
            const noticeCard = document.getElementById(`notice-${latestNoticeLink.dataset.noticeId}`);
            if (noticeCard) {
                noticeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                noticeCard.classList.add('bg-yellow-100');
                setTimeout(() => noticeCard.classList.remove('bg-yellow-100'), 2000);
            }
        }, 100);
    }
});

const generatePaymentSlip = (memberName, amount, paymentDate, packageName) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("Payment Receipt", 105, 20, null, null, 'center');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text("NUB Evening Society", 105, 30, null, null, 'center');

    doc.setLineWidth(0.5);
    doc.line(15, 35, 195, 35);

    doc.setFontSize(12);
    doc.text(`Date: ${paymentDate.toLocaleDateString()}`, 15, 45);
    
    doc.text(`Member Name: ${memberName}`, 15, 60);
    doc.text(`Package: ${packageName}`, 15, 70);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Amount Paid: $${amount.toFixed(2)}`, 15, 90);

    doc.line(15, 110, 195, 110);
    doc.setFontSize(10);
    doc.text("Thank you for your payment!", 105, 120, null, null, 'center');

    doc.save(`Payment_Slip_${memberName.replace(' ', '_')}.pdf`);
};

document.getElementById('make-payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    toggleButtonLoading(form, true);
    try {
        const [memberId, memberName] = form['payment-member-select'].value.split('|');
        const amount = parseFloat(form['payment-amount'].value);

        if (!memberId || !amount || amount <= 0) {
            showToast("Please select a member and enter a valid amount.", false);
            return;
        }

        const member = allMembers.find(m => m.id === memberId);
        const paymentData = {
            memberId,
            memberName,
            amount,
            paymentDate: new Date(),
            packageId: member.packageId,
            packageName: member.packageName,
        };

        await addDoc(collection(db, `artifacts/${appId}/public/data/payments`), paymentData);
        const memberRef = doc(db, `artifacts/${appId}/public/data/members`, memberId);
        await updateDoc(memberRef, {
            totalPaid: increment(amount)
        });
        
        showToast("Payment successful!");
        generatePaymentSlip(memberName, amount, new Date(), member.packageName);
        form.reset();

    } catch (error) {
        console.error("Payment failed:", error);
        showToast("Payment failed.", false);
    } finally {
        toggleButtonLoading(form, false);
    }
});

const renderGallerySlider = (galleryData) => {
    const wrapper = document.getElementById('gallery-wrapper');
    const slider = document.getElementById('gallery-slider');
    wrapper.innerHTML = '';
    const images = Object.values(galleryData).filter(url => url);
    if (images.length === 0) { slider.classList.add('hidden'); return; }
    slider.classList.remove('hidden');
    images.forEach(url => {
        const div = document.createElement('div');
        div.className = 'slider-item';
        div.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
        wrapper.appendChild(div);
    });
    let currentIndex = 0;
    const slide = () => { currentIndex = (currentIndex + 1) % images.length; wrapper.style.transform = `translateX(-${currentIndex * 100}%)`; };
    document.getElementById('next-slide').onclick = slide;
    document.getElementById('prev-slide').onclick = () => { currentIndex = (currentIndex - 1 + images.length) % images.length; wrapper.style.transform = `translateX(-${currentIndex * 100}%)`; };
    setInterval(slide, 5000);
};

const renderAdminGalleryPreviews = (galleryData) => {
    for (let i = 1; i <= 3; i++) {
        const img = document.getElementById(`gallery-preview-${i}`);
        if (galleryData[`image${i}`]) img.src = galleryData[`image${i}`];
    }
};

document.querySelectorAll('.save-gallery-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const btnText = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.admin-loader');
        const startLoading = () => { btn.disabled = true; if (btnText) btnText.classList.add('hidden'); if (loader) loader.classList.remove('hidden'); };
        const stopLoading = () => { btn.disabled = false; if (btnText) btnText.classList.remove('hidden'); if (loader) loader.classList.add('hidden'); };
        startLoading();
        const slot = btn.closest('.gallery-slot').dataset.slot;
        const fileInput = document.getElementById(`gallery-upload-${slot}`);
        const file = fileInput.files[0];
        if (!file) { showToast("Please select an image first.", false); stopLoading(); return; }
        if (file.size > 750 * 1024) { showToast("Image is too large (under 750 KB).", false); stopLoading(); return; }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const imageDataUrl = event.target.result;
                const galleryRef = doc(db, `artifacts/${appId}/public/data/gallery`, 'images');
                await setDoc(galleryRef, { [`image${slot}`]: imageDataUrl }, { merge: true });
                showToast(`Image ${slot} saved successfully!`);
                document.getElementById(`gallery-preview-${slot}`).src = imageDataUrl;
            } catch (error) { console.error(error); showToast("Failed to save image.", false); } 
            finally { stopLoading(); fileInput.value = ''; }
        };
        reader.onerror = () => { showToast("Failed to read the image file.", false); stopLoading(); };
        reader.readAsDataURL(file);
    });
});

window.addEventListener('popstate', (e) => {
    const pageId = (e.state && e.state.page) ? e.state.page : 'home';
    showPage(pageId, false);
});
window.onload = () => { 
    lucide.createIcons();
    populateDropdowns();
    const initialPageId = window.location.hash.substring(1) || 'home';
    showPage(initialPageId, false);
    authenticateUser();
};
