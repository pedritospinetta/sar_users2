import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


const form = document.getElementById("login-form");
const message = document.getElementById("login-message");


form.addEventListener("submit", async (event) => {

    event.preventDefault();

    message.textContent = "Verificando acceso...";
    message.className = "login-message";


    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    try {

        const credencial =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const usuario =
            credencial.user;


        const usuarioRef =
            doc(
                db,
                "usuarios",
                usuario.uid
            );


        const usuarioSnap =
            await getDoc(usuarioRef);


        if (!usuarioSnap.exists()) {

            message.textContent =
                "La cuenta no tiene permisos administrativos.";

            message.className =
                "login-message error";

            return;
        }


        const datos =
            usuarioSnap.data();


        if (
            datos.rol !== "comandante"
            ||
            datos.activo !== true
        ) {

            message.textContent =
                "La cuenta no tiene permisos administrativos activos.";

            message.className =
                "login-message error";

            return;
        }


        message.textContent =
            "Acceso autorizado. Redirigiendo...";

        message.className =
            "login-message success";


        setTimeout(() => {

            window.location.href =
                "./admin.html";

        }, 600);


    } catch (error) {

        console.error(error);

        message.textContent =
            "Correo o contraseña incorrectos.";

        message.className =
            "login-message error";

    }

});
