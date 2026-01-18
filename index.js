/* =======================================================
   NUTRI TRACK LOGIC v3.0 - ENTERPRISE EDITION
   ======================================================= */

let currentUserEmail = null;
let currentTrackerType = 'food';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const savedSession = localStorage.getItem('nutri_session');
    if (savedSession) {
        document.getElementById('landing-section').classList.add('hidden');
        currentUserEmail = savedSession;
        loginUser(currentUserEmail);
    } else {
        document.getElementById('landing-section').classList.remove('hidden');
    }
    // Set Date
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById('todayDate').innerText = today;
});

// --- NAVIGATION & AUTH ---
window.showAuth = () => {
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
}
window.showLanding = () => {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('landing-section').classList.remove('hidden');
}

document.getElementById('authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const name = document.getElementById('regName').value;

    // Profile Setup
    const userProfile = { name, email, calGoal: 2000, waterGoal: 3.0 };
    if(!localStorage.getItem(`nutri_user_${email}`)) {
        localStorage.setItem(`nutri_user_${email}`, JSON.stringify(userProfile));
    }
    
    // Data Setup
    if (!localStorage.getItem(`nutri_data_${email}`)) {
        localStorage.setItem(`nutri_data_${email}`, JSON.stringify({ calories: 0, water: 0, history: [] }));
    }

    localStorage.setItem('nutri_session', email);
    currentUserEmail = email;
    loginUser(email);
});

function loginUser(email) {
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');

    const profile = JSON.parse(localStorage.getItem(`nutri_user_${email}`));
    
    // Update Profile UI
    document.getElementById('displayUserName').innerText = profile.name;
    document.getElementById('profileName').innerText = profile.name;
    document.getElementById('profileEmail').innerText = profile.email;
    
    // Set Goals Inputs in Profile
    document.getElementById('goalCalInput').value = profile.calGoal || 2000;
    document.getElementById('goalWaterInput').value = profile.waterGoal || 3.0;

    updateDashboardUI();
    renderCalendar();
}

window.logout = () => {
    localStorage.removeItem('nutri_session');
    location.reload();
}

// --- APP NAVIGATION ---
window.switchView = (viewName) => {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.remove('hidden');
    
    if (viewName === 'dashboard') updateDashboardUI();
    if (viewName === 'calendar') renderCalendar();
}

// --- GOAL SETTING & PROFILE ---
document.getElementById('goalsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const profile = JSON.parse(localStorage.getItem(`nutri_user_${currentUserEmail}`));
    
    profile.calGoal = parseInt(document.getElementById('goalCalInput').value);
    profile.waterGoal = parseFloat(document.getElementById('goalWaterInput').value);
    
    localStorage.setItem(`nutri_user_${currentUserEmail}`, JSON.stringify(profile));
    showToast("Goals Updated Successfully!");
    updateDashboardUI();
});

// BMI Modal
window.calculateBMI = () => document.getElementById('bmiModal').classList.remove('hidden');
window.closeModal = () => document.getElementById('bmiModal').classList.add('hidden');
window.performBMICalc = () => {
    const w = parseFloat(document.getElementById('bmiWeight').value);
    const h = parseFloat(document.getElementById('bmiHeight').value) / 100; // cm to m
    if(w && h) {
        const bmi = (w / (h * h)).toFixed(1);
        let status = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : "Overweight";
        document.getElementById('bmiResult').innerText = `BMI: ${bmi} (${status})`;
    }
}

// Reminders (Fake Simulation)
window.saveReminders = () => {
    showToast("Preferences Saved! Reminders Active.");
}
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// --- TRACKER LOGIC ---
window.setTrackerType = (type) => {
    currentTrackerType = type;
    const btnFood = document.getElementById('btn-food');
    const btnWater = document.getElementById('btn-water');
    const nameGroup = document.getElementById('food-name-group');
    const trackName = document.getElementById('trackName');
    const unitSelector = document.getElementById('unitSelector');

    if (type === 'food') {
        btnFood.classList.add('active');
        btnWater.classList.remove('active');
        nameGroup.classList.remove('hidden');
        unitSelector.classList.add('hidden');
        trackName.required = true;
    } else {
        btnWater.classList.add('active');
        btnFood.classList.remove('active');
        nameGroup.classList.add('hidden');
        unitSelector.classList.remove('hidden');
        trackName.required = false;
    }
}

document.getElementById('trackerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = JSON.parse(localStorage.getItem(`nutri_data_${currentUserEmail}`));
    let val = parseFloat(document.getElementById('trackValue').value);
    const name = document.getElementById('trackName').value;
    const unit = document.getElementById('unitSelector').value;

    if (currentTrackerType === 'food') {
        data.calories += val;
    } else {
        if (unit === 'ml') val = val / 1000;
        data.water = parseFloat((data.water + val).toFixed(2));
    }

    localStorage.setItem(`nutri_data_${currentUserEmail}`, JSON.stringify(data));
    document.getElementById('trackerForm').reset();
    showToast("Entry Logged!");
    switchView('dashboard');
});

// --- DASHBOARD & CALENDAR UI ---
function updateDashboardUI() {
    const data = JSON.parse(localStorage.getItem(`nutri_data_${currentUserEmail}`));
    const profile = JSON.parse(localStorage.getItem(`nutri_user_${currentUserEmail}`));
    
    // Default goals if missing
    const cGoal = profile.calGoal || 2000;
    const wGoal = profile.waterGoal || 3.0;

    // Update Text
    document.getElementById('dashCal').innerText = data.calories;
    document.getElementById('displayCalGoal').innerText = cGoal;
    document.getElementById('dashWater').innerText = data.water + 'L';
    document.getElementById('displayWaterGoal').innerText = wGoal;

    // Ring Chart Logic
    const percent = Math.min((data.calories / cGoal) * 100, 100);
    document.getElementById('calRing').style.background = `conic-gradient(#10b981 ${percent}%, rgba(255,255,255,0.1) 0%)`;

    // Badges Logic (Gamification)
    if(data.calories >= cGoal) document.getElementById('badge-cal').className = "badge unlocked";
    if(data.water >= wGoal) document.getElementById('badge-water').className = "badge unlocked";
    // Fake streak unlock
    if(data.calories > 1) document.getElementById('badge-streak').className = "badge unlocked";
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    const data = JSON.parse(localStorage.getItem(`nutri_data_${currentUserEmail}`));
    const profile = JSON.parse(localStorage.getItem(`nutri_user_${currentUserEmail}`));
    const goal = profile.calGoal || 2000;

    // Generate 30 days
    for (let i = 1; i <= 30; i++) {
        const day = document.createElement('div');
        day.className = 'cal-day';
        day.innerText = i;
        
        // Simulating: If it's today and goal met, mark green
        // In a real app, you'd check historical dates
        const today = new Date().getDate();
        
        if (i === today && data.calories >= goal) {
            day.classList.add('active');
            day.innerHTML = `<i class="ri-check-line"></i>`; // Check mark
        } else if (i < today) {
            // Randomly filling past days for "Visual Volume"
            if (i % 2 === 0) {
                day.classList.add('active');
                day.innerHTML = `<i class="ri-check-line"></i>`;
            }
        }
        
        grid.appendChild(day);
    }
}