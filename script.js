const newChatButton = document.querySelector(".new-chat");
const searchInput = document.querySelector(".search input");

newChatButton.addEventListener("click", () => {
alert("مرحباً بك في NEXA CHAT 💬\nقريباً ستتمكن من بدء محادثة جديدة!");
});

searchInput.addEventListener("input", () => {
console.log("البحث عن:", searchInput.value);
});

console.log("NEXA CHAT Started 🚀");
