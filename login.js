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


import {
    tomarControlSistema
} from "./sistema.js";


/* =========================================
ELEMENTOS
========================================= */

const form =
    document.getElementById(
        "login-form"
    );


const message =
    document.getElementById(
        "login-message"
    );


/* =========================================
OBTENER USUARIO ADMINISTRATIVO
========================================= */

async function obtenerUsuarioAdministrativo(
    usuario
) {

    const usuarioRef =
        doc(
            db,
            "usuarios",
            usuario.uid
        );


    const usuarioSnap =
        await getDoc(
            usuarioRef
        );


    if (
        !usuarioSnap.exists()
    ) {

        return null;

    }


    const datos =
        usuarioSnap.data();


    /* =====================================
    CUENTA INACTIVA
    ===================================== */

    if (
        datos.activo !== true
    ) {

        return null;

    }


    /* =====================================
    SOLO COMANDANTE O DEVELOPER
    ===================================== */

    if (
        datos.rol !== "comandante"
        &&
        datos.rol !== "developer"
    ) {

        return null;

    }


    return {

        uid:
            usuario.uid,

        email:
            usuario.email,

        nombre:
            datos.nombre || "",

        rol:
            datos.rol,

        activo:
            datos.activo

    };

}


/* =========================================
LOGIN
========================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        message.textContent =
            "VERIFICANDO ACCESO...";


        message.className =
            "login-message";


        const email =
            document
                .getElementById(
                    "email"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "password"
                )
                .value;


        try {

            /* =================================
            INICIAR SESIÓN FIREBASE
            ================================= */

            const credencial =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const usuarioFirebase =
                credencial.user;


            /* =================================
            LEER ROL FIRESTORE
            ================================= */

            const usuario =
                await obtenerUsuarioAdministrativo(
                    usuarioFirebase
                );


            if (
                !usuario
            ) {

                await signOut(
                    auth
                );


                message.textContent =
                    "ESTA CUENTA NO TIENE PERMISOS ADMINISTRATIVOS.";


                message.className =
                    "login-message error";


                return;

            }


            /* =================================
            INTENTAR TOMAR CONTROL
            ================================= */

            message.textContent =
                "COMPROBANDO ESTADO DEL SISTEMA...";


            const control =
                await tomarControlSistema(
                    usuario
                );


            /* =================================
            COMANDANTE BLOQUEADO POR DEVELOPER
            ================================= */

            if (
                usuario.rol === "comandante"
                &&
                control.permitido === false
                &&
                control.modo === "developer"
            ) {

                await signOut(
                    auth
                );


                window.location.replace(
                    "./mantenimiento.html"
                );


                return;

            }


            /* =================================
            DEVELOPER
            ================================= */

            if (
                usuario.rol === "developer"
            ) {

                message.textContent =
                    "ACCESO DE DESARROLLADOR AUTORIZADO.";


                message.className =
                    "login-message success";


                sessionStorage.setItem(
                    "sarRol",
                    "developer"
                );


                sessionStorage.setItem(
                    "sarNombre",
                    usuario.nombre
                    ||
                    "DEVELOPER"
                );


                setTimeout(
                    () => {

                        window.location.replace(
                            "./admin.html"
                        );

                    },
                    500
                );


                return;

            }


            /* =================================
            COMANDANTE
            ================================= */

            if (
                usuario.rol === "comandante"
            ) {

                message.textContent =
                    "ACCESO ADMINISTRATIVO AUTORIZADO.";


                message.className =
                    "login-message success";


                sessionStorage.setItem(
                    "sarRol",
                    "comandante"
                );


                sessionStorage.setItem(
                    "sarNombre",
                    usuario.nombre
                    ||
                    "COMANDANTE"
                );


                setTimeout(
                    () => {

                        window.location.replace(
                            "./admin.html"
                        );

                    },
                    500
                );


                return;

            }


            /* =================================
            SEGURIDAD EXTRA
            ================================= */

            await signOut(
                auth
            );


            message.textContent =
                "NO SE PUDO AUTORIZAR EL ACCESO.";


            message.className =
                "login-message error";


        } catch (error) {

            console.error(
                "ERROR DE INICIO DE SESIÓN:",
                error
            );


            try {

                if (
                    auth.currentUser
                ) {

                    await signOut(
                        auth
                    );

                }

            } catch (
                logoutError
            ) {

                console.error(
                    logoutError
                );

            }


            message.textContent =
                "CORREO ELECTRÓNICO O CONTRASEÑA INCORRECTOS.";


            message.className =
                "login-message error";

        }

    }
);
