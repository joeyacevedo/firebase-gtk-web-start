// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from 'firebase/app';

// Add the Firebase products and methods that you want to use
import {
  getAuth,
  EmailAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  where,
} from 'firebase/firestore';

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

let rsvpListener = null;
let guestbookListener = null;

let db, auth;

async function main() {
  // Add Firebase project configuration object here

  const firebaseConfig = {
    apiKey: 'AIzaSyBc0RqoZ6qqRe8cj14aEIG5KQzh7crV9ms',
    authDomain: 'fir-web-codelab-d37ca.firebaseapp.com',
    projectId: 'fir-web-codelab-d37ca',
    storageBucket: 'fir-web-codelab-d37ca.appspot.com',
    messagingSenderId: '1057611573952',
    appId: '1:1057611573952:web:47a9232e7e0803f1745b25',
  };

  // initializeApp(firebaseConfig);
  const app = initializeApp(firebaseConfig);
  auth = getAuth();
  db = getFirestore();

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      },
    },
  };

  // const ui = new firebaseui.auth.AuthUI(auth);
  const ui = new firebaseui.auth.AuthUI(auth);

  //Listen to RSVP button clicks
  startRsvpButton.addEventListener('click', () => {
    if (auth.currentUser) {
      signOut(auth);
    } else {
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  });

  //Listen to the current Auth state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      startRsvpButton.textContent = 'LOGOUT';
      //Show guestbook to logged-in users
      guestbookContainer.style.display = 'block';
      //Subsribe to the guestbook collection
      subscribeGuestbook();
      subcribeCurrentRSVP(user);
    } else {
      startRsvpButton.textContent = 'RSVP';
      // Hide guestbook for non-logged-in users
      guestbookContainer.style.display = 'none';
      //Unsubscribe from the guestbook collection
      unsubscribeGuestbook();
      unsubscribeCurrentRSVP(user);
    }
  });

  form.addEventListener('submit', async (e) => {
    //Prevent the default form redirect
    e.preventDefault();

    //Write a new message to the database collection "guestbook"
    addDoc(collection(db, 'guestbook'), {
      text: input.value,
      timestamp: Date.now(),
      name: auth.currentUser.displayName,
      userId: auth.currentUser.uid,
    });

    //Clear message input field
    input.value = '';

    //Return false to avoid redirect
    return false;
  });

  //Listen to guestbook updates
  function subscribeGuestbook() {
    //Create query for messages
    const q = query(collection(db, 'guestbook'), orderBy('timestamp', 'desc'));
    guestbookListener = onSnapshot(q, (snaps) => {
      //Reset Page
      guestbook.innerHTML = '';
      //Loop through documents in database
      snaps.forEach((doc) => {
        //Create an HTML entry for each document and add it to the chat
        const entry = document.createElement('p');
        entry.textContent = doc.data().name + ': ' + doc.data().text;
        guestbook.appendChild(entry);
      });
    });
  }

  //Unsubscribe from guestbook updates
  function unsubscribeGuestbook() {
    if (guestbookListener != null) {
      guestbookListener();
      guestbookListener = null;
    }
  }

  rsvpYes.onclick = async () => {
    const userRef = doc(db, 'attendees', auth.currentUser.uid);

    try {
      await setDoc(userRef, {
        attending: true,
      });
    } catch (e) {
      console.error(e);
    }
  };
  rsvpNo.onclick = async () => {
    const userRef = doc(db, 'attendees', auth.currentUser.uid);

    try {
      await setDoc(userRef, {
        attending: false,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const attendingQuery = query(
    collection(db, 'attendees'),
    where('attending', '==', true)
  );

  const unsubscribe = onSnapshot(attendingQuery, (snap) => {
    const newAttendeeCount = snap.docs.length;

    if (newAttendeeCount === 0) {
      numberAttending.innerHTML = 'No one is currently going';
    } else if (newAttendeeCount === 1) {
      numberAttending.innerHTML = newAttendeeCount + ' person going';
    } else {
      numberAttending.innerHTML = newAttendeeCount + ' people going';
    }
  });

  function subcribeCurrentRSVP(user) {
    const ref = doc(db, 'attendees', user.uid);
    rsvpListener = onSnapshot(ref, (doc) => {
      if (doc && doc.data()) {
        const attendingResponse = doc.data().attending;

        //Update css classes for buttons
        if (attendingResponse) {
          rsvpYes.className = 'clicked';
          rsvpNo.className = '';
        } else {
          rsvpYes.className = '';
          rsvpNo.className = 'clicked';
        }
      }
    });
  }

  function unsubscribeCurrentRSVP() {
    if (rsvpListener != null) {
      rsvpListener();
      rsvpListener = null;
    }
    rsvpYes.className = '';
    rsvpNo.className = '';
  }
}
main();
