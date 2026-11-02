import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

const firebaseConfig = {
apiKey: "AIzaSyAEd46Utjpx_4veEwUow1crIgVPCiUvykM",
authDomain: "nexa-chat-3fa17.firebaseapp.com",
projectId: "nexa-chat-3fa17",
storageBucket: "nexa-chat-3fa17.firebasestorage.app",
messagingSenderId: "698590769415",
appId: "1:698590769415:web:f57a71971096284e0315a2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let isRegister = true;

const authForm = document.getElementById("authForm");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const toggleAuth = document.getElementById("toggleAuth");
const toggleText = document.getElementById("toggleText");
const message = document.getElementById("message");

const authSection = document.getElementById("authSection");
const chatSection = document.getElementById("chatSection");
const userEmail = document.getElementById("userEmail");

toggleAuth.addEventListener("click", (e) => {
e.preventDefault();

isRegister = !isRegister;

formTitle.textContent = isRegister ? "إنشاء حساب" : "تسجيل الدخول";
submitBtn.textContent = isRegister ? "إنشاء حساب" : "دخول";

toggleText.innerHTML = isRegister
    ? 'لديك حساب بالفعل؟ <a href="#" id="toggleAuth">تسجيل الدخول</a>'
    : 'ليس لديك حساب؟ <a href="#" id="toggleAuth">إنشاء حساب</a>';

document.getElementById("toggleAuth").addEventListener("click", (event) => {
    event.preventDefault();
    isRegister = !isRegister;
    location.reload();
});

message.textContent = "";

});

authForm.addEventListener("submit", async (e) => {
e.preventDefault();

const email = document.getElementById("email").value.trim();
const password = document.getElementById("password").value;

submitBtn.disabled = true;
message.textContent = "جاري التنفيذ...";

try {
    if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        message.textContent = "تم إنشاء الحساب بنجاح 🎉";
    } else {
        await signInWithEmailAndPassword(auth, email, password);
        message.textContent = "تم تسجيل الدخول بنجاح";
    }
} catch (error) {
    message.textContent = "حدث خطأ: " + error.message;
} finally {
    submitBtn.disabled = false;
}

});

document.getElementById("logoutBtn").addEventListener("click", async () => {
await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
if (user) {
authSection.hidden = true;
chatSection.hidden = false;
userEmail.textContent = user.email;
} else {
authSection.hidden = false;
chatSection.hidden = true;
}
});
