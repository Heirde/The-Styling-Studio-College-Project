import { auth, db } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

if (!document.querySelector(".profile-wrapper")) {
    document.querySelector("nav").insertAdjacentHTML("beforeend", `
        <div class="profile-wrapper">
            <button class="profile-btn" type="button">
                <div class="profile-avatar" id="profileAvatar">?</div>
                <span class="profile-name" id="profileName">Guest</span>
                <span class="profile-chevron">›</span>
            </button>
            <div class="profile-dropdown" id="profileDropdown">
                <div id="loggedInSection">
                    <div class="user-info">
                        <span id="userRole">guest</span>
                    </div>
                    <hr>
                    <a href="ExternalPages/account.html">My Account</a>
                    <a href="ExternalPages/settings.html">Settings</a>
                    <a href="admin.html" id="adminLink" style="display:none;">Admin Panel</a>
                    <hr>
                    <a href="#" class="signout">Sign Out</a>
                </div>
                <div id="loggedOutSection">
                    <div class="dropdown-login">
                        <div id="signInForm">
                            <p class="dropdown-login-title">Sign In</p>
                            <input type="email" id="dropdownEmail" placeholder="Email">
                            <input type="password" id="dropdownPassword" placeholder="Password">
                            <button class="dropdown-login-btn" id="dropdownLoginBtn" type="button">Sign In</button>
                            <p class="dropdown-toggle-text">
                                <span id="forgotPassword">Forgot Password?</span>
                            </p>
                            <p class="dropdown-toggle-text">No account?
                                <span id="showSignUp">Register</span>
                            </p>
                        </div>
                        <div id="signUpForm" style="display: none;">
                            <p class="dropdown-login-title">Create Account</p>
                            <input type="text" id="signUpFirstName" placeholder="First name">
                            <input type="text" id="signUpLastName" placeholder="Last name">
                            <input type="email" id="signUpEmail" placeholder="Email">
                            <input type="password" id="signUpPassword" placeholder="Password">
                            <button class="dropdown-login-btn" id="dropdownSignUpBtn" type="button">Create Account</button>
                            <p class="dropdown-toggle-text">Have an account?
                                <span id="showSignIn">Sign In</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
}

const avatar = document.getElementById("profileAvatar");
const nameEl = document.getElementById("profileName");
const loggedInSection = document.getElementById("loggedInSection");
const loggedOutSection = document.getElementById("loggedOutSection");

async function loadUser(user) {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        const firstName = userData.firstName || "User";
        const lastName = userData.lastName || "";
        const role = userData.role || "guest";
        const clearance = userData.clearance || 1;

        localStorage.setItem("firstName", firstName);
        localStorage.setItem("lastName", lastName);
        localStorage.setItem("role", role);
        localStorage.setItem("clearance", clearance);
        localStorage.setItem("uid", user.uid);

        avatar.textContent = (firstName[0] + (lastName[0] || "")).toUpperCase();
        nameEl.textContent = firstName + " " + lastName;
        loggedInSection.style.display = "block";
        loggedOutSection.style.display = "none";

        const roleBadge = document.getElementById("userRole");
        const bowLink = document.getElementById("bowLink");
        const adminLink = document.getElementById("adminLink");

        if (roleBadge) roleBadge.textContent = role;
        if (bowLink) bowLink.style.display = parseInt(clearance) >= 4 ? "block" : "none";
        if (adminLink) {
            adminLink.style.display = role === "admin" && Number(clearance) >= 6 ? "block" : "none";
        }

    } else {
        localStorage.clear();
        avatar.textContent = "?";
        nameEl.textContent = "Guest";
        loggedInSection.style.display = "none";
        loggedOutSection.style.display = "block";

        const bowLink = document.getElementById("bowLink");
        const adminLink = document.getElementById("adminLink");
        if (bowLink) bowLink.style.display = "none";
        if (adminLink) adminLink.style.display = "none";
    }
}

onAuthStateChanged(auth, user => {
    loadUser(user).catch(error => {
        console.error("Unable to load the signed-in user's profile.", error);
        alert("Unable to load your profile right now.");
    });
});

// Dropdown toggle
document.querySelector(".profile-btn").addEventListener("click", function(e) {
    e.stopPropagation();
    document.getElementById("profileDropdown").classList.toggle("open");
    this.classList.toggle("active");
});

// Close when clicking outside
document.addEventListener("click", function(e) {
    if (!e.target.closest(".profile-wrapper")) {
        document.getElementById("profileDropdown").classList.remove("open");
        document.querySelector(".profile-btn").classList.remove("active");
    }
});

// Sign in
document.getElementById("dropdownLoginBtn").addEventListener("click", async function() {
    const email = document.getElementById("dropdownEmail").value.trim();
    const pass = document.getElementById("dropdownPassword").value;

    if (!email || !pass) return;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        document.getElementById("profileDropdown").classList.remove("open");
    } catch (err) {
        if (err.code === "auth/user-not-found") {
            alert("Account not found");
        } else if (err.code === "auth/wrong-password") {
            alert("Incorrect password");
        } else if (err.code === "auth/invalid-email") {
            alert("Invalid email address");
        } else {
            alert(err.message);
        }
    }
});

// Sign up
document.getElementById("dropdownSignUpBtn").addEventListener("click", async function() {
    const firstName = document.getElementById("signUpFirstName").value.trim();
    const lastName = document.getElementById("signUpLastName").value.trim();
    const email = document.getElementById("signUpEmail").value.trim();
    const pass = document.getElementById("signUpPassword").value;

    if (!firstName || !lastName || !email || !pass) {
        alert("All fields are required");
        return;
    }

    if (pass.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            firstName,
            lastName,
            email,
            role: "guest",
            clearance: 1,
        });

        document.getElementById("profileDropdown").classList.remove("open");

    } catch (err) {
        if (err.code === "auth/email-already-in-use") {
            alert("Email already registered");
        } else if (err.code === "auth/invalid-email") {
            alert("Invalid email address");
        } else if (err.code === "auth/weak-password") {
            alert("Password must be at least 6 characters");
        } else {
            alert(err.message);
        }
    }
});

// Toggle between sign in and sign up forms
document.getElementById("showSignUp").addEventListener("click", function() {
    document.getElementById("signInForm").style.display = "none";
    document.getElementById("signUpForm").style.display = "flex";
});

document.getElementById("showSignIn").addEventListener("click", function() {
    document.getElementById("signUpForm").style.display = "none";
    document.getElementById("signInForm").style.display = "flex";
});

// Sign out
document.querySelector(".signout").addEventListener("click", async function() {
    await signOut(auth);
    document.getElementById("profileDropdown").classList.remove("open");
});

// Forgot password
document.getElementById("forgotPassword")?.addEventListener("click", async function() {
    const email = document.getElementById("dropdownEmail").value.trim();
    if (!email) {
        alert("Enter your email first then click Forgot Password");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent — check your inbox");
    } catch (err) {
        if (err.code === "auth/user-not-found") {
            alert("No account found with that email");
        } else {
            alert(err.message);
        }
    }
});