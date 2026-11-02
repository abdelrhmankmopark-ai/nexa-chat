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
serverTimestamp,
collection,
query,
where,
orderBy,
startAt,
endAt,
limit,
getDocs,
getDoc,
addDoc,
onSnapshot
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyAEd46Utjpx_4veEwUow1crIgVPCiUvyk",
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
let currentUser = null;
let activeChatId = null;
let stopChatsListener = null;
let stopMessagesListener = null;

const $ = id => document.getElementById(id);

const authForm = $("authForm");
const formTitle = $("formTitle");
const submitBtn = $("submitBtn");
const toggleText = $("toggleText");
const message = $("message");

const usernameInput = $("username");
const emailInput = $("email");
const passwordInput = $("password");

const authSection = $("authSection");
const chatSection = $("chatSection");
const userEmail = $("userEmail");

const searchForm = $("searchForm");
const searchUsername = $("searchUsername");
const searchBtn = $("searchBtn");
const searchResults = $("searchResults");

const conversationsList = $("conversationsList");
const activeChat = $("activeChat");
const chatTitle = $("chatTitle");
const chatMessages = $("chatMessages");
const sendMessageForm = $("sendMessageForm");
const messageInput = $("messageInput");
const sendBtn = $("sendBtn");
const chatStatus = $("chatStatus");
const backBtn = $("backBtn");

// رسائل أخطاء Firebase
function getErrorMessage(error) {
const errors = {
"auth/email-already-in-use":
"هذا البريد مسجل بالفعل. انتقل إلى تسجيل الدخول.",

    "auth/invalid-email":
        "البريد الإلكتروني غير صحيح.",

    "auth/weak-password":
        "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",

    "auth/invalid-credential":
        "البريد الإلكتروني أو كلمة المرور غير صحيحة.",

    "auth/user-not-found":
        "لا يوجد حساب بهذا البريد. أنشئ حسابًا جديدًا.",

    "auth/wrong-password":
        "كلمة المرور غير صحيحة.",

    "auth/network-request-failed":
        "مشكلة في الإنترنت. حاول مرة أخرى.",

    "auth/too-many-requests":
        "محاولات كثيرة. انتظر قليلًا ثم حاول.",

    "permission-denied":
        "تعذر حفظ البيانات. راجع قواعد Firestore.",

    "auth/operation-not-allowed":
        "تسجيل البريد الإلكتروني غير مفعّل في Firebase."
};

return errors[error.code] ||
    error.message ||
    "حدث خطأ غير متوقع.";

}

// التبديل بين التسجيل والدخول
function showAuthMode() {
formTitle.textContent = isRegister
? "إنشاء حساب جديد"
: "تسجيل الدخول";

submitBtn.textContent = isRegister
    ? "إنشاء حساب"
    : "تسجيل الدخول";

usernameInput.hidden = !isRegister;
usernameInput.required = isRegister;

passwordInput.autocomplete = isRegister
    ? "new-password"
    : "current-password";

toggleText.replaceChildren();

const text = document.createElement("span");
text.textContent = isRegister
    ? "لديك حساب بالفعل؟ "
    : "ليس لديك حساب؟ ";

const link = document.createElement("a");
link.href = "#";
link.textContent = isRegister
    ? "انتقل لتسجيل الدخول"
    : "إنشاء حساب جديد";

link.addEventListener("click", event => {
    event.preventDefault();

    isRegister = !isRegister;

    authForm.reset();
    message.textContent = "";

    showAuthMode();
});

toggleText.append(text, link);

}

showAuthMode();

// إنشاء أو استكمال الملف الشخصي
async function saveUserProfile(user, username) {
await setDoc(doc(db, "users", user.uid), {
uid: user.uid,
username: username,
usernameLower: username.toLowerCase(),
createdAt: serverTimestamp()
}, { merge: true });
}

// التسجيل وتسجيل الدخول
authForm.addEventListener("submit", async event => {
event.preventDefault();

const email = emailInput.value.trim();
const password = passwordInput.value;
const username = usernameInput.value.trim();

if (!email || !password) {
    message.textContent = "أدخل البريد وكلمة المرور.";
    return;
}

if (isRegister && (username.length < 3 || username.length > 20)) {
    message.textContent =
        "اسم المستخدم يجب أن يكون من 3 إلى 20 حرفًا.";
    return;
}

submitBtn.disabled = true;
message.textContent = isRegister
    ? "جاري إنشاء الحساب..."
    : "جاري تسجيل الدخول...";

try {
    if (isRegister) {
        const credential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        await updateProfile(credential.user, {
            displayName: username
        });

        try {
            await saveUserProfile(credential.user, username);

            message.textContent = "تم إنشاء حسابك بنجاح 🎉";
        } catch (profileError) {
            console.error("Profile save error:", profileError);

            message.textContent =
                "تم إنشاء الحساب، لكن تعذر حفظ ملفك الشخصي. تحقق من قواعد Firestore.";
        }

    } else {
        const credential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        // استكمال الملف الشخصي لو كان غير موجود
        const profileRef = doc(db, "users", credential.user.uid);
        const profileSnapshot = await getDoc(profileRef);

        if (!profileSnapshot.exists()) {
            const savedName =
                credential.user.displayName ||
                email.split("@")[0];

            await saveUserProfile(credential.user, savedName);
        }

        message.textContent = "تم تسجيل الدخول بنجاح 🎉";
    }

} catch (error) {
    console.error("Authentication error:", error);
    message.textContent = getErrorMessage(error);

} finally {
    submitBtn.disabled = false;
}

});

// تسجيل الخروج
$("logoutBtn").addEventListener("click", async () => {
try {
await signOut(auth);
} catch (error) {
console.error(error);
chatStatus.textContent = "تعذر تسجيل الخروج.";
}
});

// إنشاء زر
function makeButton(label, className, onClick) {
const button = document.createElement("button");

button.type = "button";
button.className = className;
button.textContent = label;

button.addEventListener("click", onClick);

return button;

}

// البحث عن المستخدمين
async function searchUsers(term) {
const normalized = term.trim().toLowerCase();

if (normalized.length < 3) {
    searchResults.textContent = "اكتب 3 أحرف على الأقل.";
    return;
}

searchBtn.disabled = true;
searchResults.textContent = "جاري البحث...";

try {
    const usersQuery = query(
        collection(db, "users"),
        orderBy("usernameLower"),
        startAt(normalized),
        endAt(normalized + "\uf8ff"),
        limit(10)
    );

    const result = await getDocs(usersQuery);

    searchResults.replaceChildren();

    const matches = result.docs.filter(
        item => item.id !== currentUser.uid
    );

    if (matches.length === 0) {
        searchResults.textContent =
            "لم نعثر على مستخدم بهذا الاسم.";
        return;
    }

    matches.forEach(item => {
        const data = item.data();

        const row = document.createElement("div");
        row.className = "user-result";

        const name = document.createElement("span");
        name.textContent = data.username || "مستخدم NEXA";

        const button = makeButton(
            "ابدأ محادثة",
            "start-chat-btn",
            () => openChat(
                item.id,
                data.username || "مستخدم NEXA"
            )
        );

        row.append(name, button);
        searchResults.appendChild(row);
    });

} catch (error) {
    console.error("Search error:", error);

    searchResults.textContent =
        "حدث خطأ أثناء البحث. تحقق من اتصال Firebase.";

} finally {
    searchBtn.disabled = false;
}

}

searchForm.addEventListener("submit", event => {
event.preventDefault();
searchUsers(searchUsername.value);
});

// فتح محادثة
async function openChat(otherUid, otherName) {
if (!currentUser || otherUid === currentUser.uid) return;

chatStatus.textContent = "جاري فتح المحادثة...";

try {
    const chatsQuery = query(
        collection(db, "chats"),
        where("members", "array-contains", currentUser.uid)
    );

    const chatsSnapshot = await getDocs(chatsQuery);

    const existing = chatsSnapshot.docs.find(item =>
        item.data().members.includes(otherUid)
    );

    let chatId;

    if (existing) {
        chatId = existing.id;
    } else {
        const newChat = await addDoc(collection(db, "chats"), {
            members: [currentUser.uid, otherUid],
            createdAt: serverTimestamp()
        });

        chatId = newChat.id;
    }

    activeChatId = chatId;
    chatTitle.textContent = otherName;

    activeChat.hidden = false;
    conversationsList.parentElement.hidden = true;
    searchForm.parentElement.hidden = true;

    chatStatus.textContent = "";

    listenToMessages(chatId);

} catch (error) {
    console.error("Open chat error:", error);

    chatStatus.textContent =
        "تعذر فتح المحادثة. تحقق من صلاحيات Firebase.";
}

}

// تحميل المحادثات
function listenToConversations(user) {
if (stopChatsListener) stopChatsListener();

const chatsQuery = query(
    collection(db, "chats"),
    where("members", "array-contains", user.uid)
);

stopChatsListener = onSnapshot(chatsQuery, async snapshot => {
    conversationsList.replaceChildren();

    if (snapshot.empty) {
        conversationsList.textContent =
            "لا توجد محادثات بعد. ابحث عن صديق للبدء.";
        return;
    }

    for (const chatDoc of snapshot.docs) {
        const members = chatDoc.data().members || [];
        const otherUid = members.find(uid => uid !== user.uid);

        if (!otherUid) continue;

        try {
            const profile = await getDoc(
                doc(db, "users", otherUid)
            );

            const name = profile.exists()
                ? profile.data().username || "مستخدم NEXA"
                : "مستخدم NEXA";

            const button = makeButton(
                name,
                "conversation-item",
                () => openChat(otherUid, name)
            );

            conversationsList.appendChild(button);

        } catch (error) {
            console.error(error);
        }
    }

}, error => {
    console.error("Conversations error:", error);

    conversationsList.textContent =
        "تعذر تحميل المحادثات.";
});

}

// استقبال الرسائل
function listenToMessages(chatId) {
if (stopMessagesListener) stopMessagesListener();

const messagesQuery = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
);

stopMessagesListener = onSnapshot(messagesQuery, snapshot => {
    chatMessages.replaceChildren();

    if (snapshot.empty) {
        const empty = document.createElement("p");
        empty.textContent = "ابدأ المحادثة بإرسال أول رسالة 👋";

        chatMessages.appendChild(empty);
        return;
    }

    snapshot.forEach(messageDoc => {
        const data = messageDoc.data();

        const bubble = document.createElement("div");

        bubble.className =
            data.senderId === currentUser.uid
                ? "message-bubble my-message"
                : "message-bubble received-message";

        bubble.textContent = data.text || "";

        chatMessages.appendChild(bubble);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;

}, error => {
    console.error("Messages error:", error);

    chatStatus.textContent = "تعذر تحميل الرسائل.";
});

}

// إرسال رسالة
sendMessageForm.addEventListener("submit", async event => {
event.preventDefault();

const text = messageInput.value.trim();

if (!text || !activeChatId || !currentUser) return;

sendBtn.disabled = true;
chatStatus.textContent = "جاري الإرسال...";

try {
    await addDoc(
        collection(db, "chats", activeChatId, "messages"),
        {
            senderId: currentUser.uid,
            text,
            createdAt: serverTimestamp()
        }
    );

    messageInput.value = "";
    chatStatus.textContent = "";

} catch (error) {
    console.error("Send message error:", error);

    chatStatus.textContent =
        "لم تُرسل الرسالة. تحقق من قواعد Firestore.";

} finally {
    sendBtn.disabled = false;
}

});

// الرجوع للمحادثات
backBtn.addEventListener("click", () => {
activeChat.hidden = true;

conversationsList.parentElement.hidden = false;
searchForm.parentElement.hidden = false;

activeChatId = null;
chatStatus.textContent = "";

if (stopMessagesListener) {
    stopMessagesListener();
    stopMessagesListener = null;
}

});

// متابعة تسجيل الدخول
onAuthStateChanged(auth, user => {
currentUser = user;

if (user) {
    authSection.hidden = true;
    chatSection.hidden = false;

    userEmail.textContent =
        user.displayName || user.email || "مستخدم NEXA";

    listenToConversations(user);

} else {
    authSection.hidden = false;
    chatSection.hidden = true;

    userEmail.textContent = "";

    if (stopChatsListener) {
        stopChatsListener();
        stopChatsListener = null;
    }

    if (stopMessagesListener) {
        stopMessagesListener();
        stopMessagesListener = null;
    }

    activeChat.hidden = true;

    conversationsList.parentElement.hidden = false;
    searchForm.parentElement.hidden = false;

    currentUser = null;
    activeChatId = null;
}

});
