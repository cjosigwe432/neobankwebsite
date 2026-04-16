const firebaseConfig = {
  apiKey: "AIzaSyDLvK-Q4v1hZ2B-mtxZzNXs5m1tCS6LdGw",
  authDomain: "neobank-app-3ebbe.firebaseapp.com",
  projectId: "neobank-app-3ebbe",
  storageBucket: "neobank-app-3ebbe.firebasestorage.app",
  messagingSenderId: "258331631270",
  appId: "1:258331631270:web:f4eeeb8ac1e3177bb21e67",
  measurementId: "G-9VRK9ZZXYS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

/* ===== IMAGES ===== */
const UI = {
  avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
  card: "https://images.pexels.com/photos/164527/pexels-photo-164527.jpeg",
  icon: "https://cdn-icons-png.flaticon.com/512/2331/2331940.png"
};

/* ===== SIGNUP ===== */
function signup() {
  auth.createUserWithEmailAndPassword(email(), password())
    .then(user => {
      db.collection("users").doc(user.user.uid).set({
        email: email(),
        balance: 1000,
        transactions: []
      });
    });
}

/* ===== LOGIN ===== */
function login() {
  auth.signInWithEmailAndPassword(email(), password());
}

/* ===== LOGOUT ===== */
function logout() {
  auth.signOut();
}

/* ===== AUTH STATE ===== */
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;

    document.getElementById("auth").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    // images
    document.getElementById("avatar").src = UI.avatar;
    document.getElementById("cardImage").src = UI.card;

    loadUser();
  } else {
    document.getElementById("auth").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
  }
});

/* ===== LOAD USER ===== */
function loadUser() {
  db.collection("users").doc(currentUser.uid).onSnapshot(doc => {
    const data = doc.data();
    document.getElementById("balance").innerText = data.balance;

    const history = document.getElementById("history");
    history.innerHTML = "";

    data.transactions.forEach(t => {
      const li = document.createElement("li");
      li.innerHTML = `<img src="${UI.icon}" width="14"> ${t}`;
      history.appendChild(li);
    });
  });
}

/* ===== SEND MONEY ===== */
function sendMoney() {
  const receiverEmail = document.getElementById("receiver").value;
  const amount = parseInt(document.getElementById("amount").value);

  db.collection("users").where("email", "==", receiverEmail).get()
    .then(snapshot => {
      if (snapshot.empty) return alert("User not found");

      const receiver = snapshot.docs[0];

      db.runTransaction(async (t) => {
        const senderRef = db.collection("users").doc(currentUser.uid);
        const receiverRef = db.collection("users").doc(receiver.id);

        const senderSnap = await t.get(senderRef);
        const receiverSnap = await t.get(receiverRef);

        let senderBalance = senderSnap.data().balance;

        if (amount > senderBalance) return alert("No money");

        t.update(senderRef, {
          balance: senderBalance - amount,
          transactions: [...senderSnap.data().transactions, `Sent $${amount} to ${receiverEmail}`]
        });

        t.update(receiverRef, {
          balance: receiverSnap.data().balance + amount,
          transactions: [...receiverSnap.data().transactions, `Received $${amount}`]
        });
      });
    });
}

/* ===== HELPERS ===== */
function email() {
  return document.getElementById("email").value;
}

function password() {
  return document.getElementById("password").value;
}