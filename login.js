import {
    auth,
    db
} from "./firebase-config.js";


import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


const form =
    document.getElementById("login-form");


const message =
    document.getElementById("login-message");


async function verificarComandante(usuario) {

    const usuarioRef =
        doc(
            db,
            "usuarios",
            usuario.uid
        );


    const usuarioSnap =
        await getDoc(usuarioRef);


    if (!usuarioSnap.exists()) {
        return false;
    }


    const datos =
        usuarioSnap.data();


    return (
        datos.rol === "comandante"
        &&
        datos.activo === true
    );

}


form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        message.textContent =
            "Verificando acceso...";

        message.className =
            "login-message";


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        try {

            const credencial =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const usuario =
                credencial.user;


            const autorizado =
                await verificarComandante(
                    usuario
                );


            if (!autorizado) {

                await signOut(auth);


                message.textContent =
                    "Esta cuenta no tiene permisos administrativos.";

                message.className =
                    "login-message error";

                return;

            }


            message.textContent =
                "Acceso autorizado.";

            message.className =
                "login-message success";


            setTimeout(
                () => {

                    window.location.href =
                        "./admin.html";

                },
                700
            );


        } catch (error) {

            console.error(
                "Error de inicio de sesión:",
                error
            );


            message.textContent =
                "Correo electrónico o contraseña incorrectos.";

            message.className =
                "login-message error";

        }

    }
);
