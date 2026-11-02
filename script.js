import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged,
updateProfile
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
getFirestore,
doc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

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
const db = getFirestore(app);

let isRegister = true;

const authForm = document.getElementById("authForm");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const toggleText = document.getElementById("toggleText");
const message = document.getElementById("message");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const authSection = document.getElementById("authSection");
const chatSection = document.getElementById("chatSection");
const userEmail = document.getElementById("userEmail");

function renderAuthMode() {
formTitle.textContent = isRegister ? "إنشاء حساب" : "تسجيل الدخول";
submitBtn.textContent = isRegister ? "إنشاء حساب" : "دخول";

usernameInput.hidden = !isRegister;
usernameInput.required = isRegister;

passwordInput.autocomplete = isRegister
    ? "new-password"
    : "current-password";

toggleText.innerHTML = isRegister
    ? 'لديك حساب بالفعل؟ <a href="#" id="toggleAuth">تسجيل الدخول</a>'
    : 'ليس لديك حساب؟ <a href="#" id="toggleAuth">إنشاء حساب</a>';

document.getElementById("toggleAuth").addEventListener("click", (event) => {
    event.preventDefault();
    isRegister = !isRegister;
    message.textContent = "";
    renderAuthMode();
});

}

renderAuthMode();

authForm.addEventListener("submit", async (event) => {
event.preventDefault();

const email = emailInput.value.trim();
const password = passwordInput.value;
const username = usernameInput.value.trim();

submitBtn.disabled = true;
message.textContent = "جاري التنفيذ...";

try {
    if (isRegister) {
        if (username.length < 3 || username.length > 20) {
            throw new Error("اسم المستخدم يجب أن يكون من 3 إلى 20 حرفًا.");
        }

        const credential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        await updateProfile(credential.user, {
            displayName: username
        });

        await setDoc(doc(db, "users", credential.user.uid), {
            uid: credential.user.uid,
            username: username,
            usernameLower: username.toLowerCase(),
            createdAt: serverTimestamp()
        });

        message.textContent = "تم إنشاء الحساب بنجاح 🎉";

    } else {
        await signInWithEmailAndPassword(auth, email, password);
        message.textContent = "تم تسجيل الدخول بنجاح 🎉";
    }

} catch (error) {
    console.error("NEXA Error:", error);

    const errors = {
        "auth/email-already-in-use": "هذا البريد الإلكتروني مستخدم بالفعل.",
        "auth/invalid-email": "البريد الإلكتروني غير صحيح.",
        "auth/weak-password": "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
        "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        "auth/network-request-failed": "تحقق من اتصال الإنترنت.",
        "permission-denied": "تعذر حفظ بيانات المستخدم. تحقق من قواعد Firebase."
    };

    message.textContent =
        errors[error.code] || error.message || "حدث خطأ غير متوقع.";

} finally {
    submitBtn.disabled = false;
}

});

document.getElementById("logoutBtn").addEventListener("click", async () => {
try {
await signOut(auth);
} catch (error) {
console.error(error);
message.textContent = "تعذر تسجيل الخروج.";
}
});

onAuthStateChanged(auth, (user) => {
if (user) {
authSection.hidden = true;
chatSection.hidden = false;

    userEmail.textContent = user.displayName || "مستخدم NEXA";

} else {
    authSection.hidden = false;
    chatSection.hidden = true;
    userEmail.textContent = "";
}

});
