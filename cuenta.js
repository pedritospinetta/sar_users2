import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateEmail,
    updatePassword,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


import {
    tomarControlSistema,
    iniciarHeartbeat,
    detenerHeartbeat,
    escucharSistema
} from "./sistema.js";


/* =========================================================
   ELEMENTOS
========================================================= */

const loading =
    document.getElementById(
        "loading"
    );


const accountContent =
    document.getElementById(
        "account-content"
    );


const currentEmail =
    document.getElementById(
        "current-email"
    );


const currentRole =
    document.getElementById(
        "current-role"
    );


const emailForm =
    document.getElementById(
        "email-form"
    );


const passwordForm =
    document.getElementById(
        "password-form"
    );


const emailMessage =
    document.getElementById(
        "email-message"
    );


const passwordMessage =
    document.getElementById(
        "password-message"
    );


const changeEmailButton =
    document.getElementById(
        "change-email-button"
    );


const changePasswordButton =
    document.getElementById(
        "change-password-button"
    );


/* =========================================================
   VARIABLES
========================================================= */

let usuarioSistema =
    null;


let detenerEscucha =
    null;


/* =========================================================
   OBTENER ROL
========================================================= */

async function obtenerUsuarioAdministrativo(
    usuario
) {

    const resultado =
        await getDoc(
            doc(
                db,
                "usuarios",
                usuario.uid
            )
        );


    if (!resultado.exists()) {

        throw new Error(
            "NO EXISTE EL REGISTRO ADMINISTRATIVO."
        );

    }


    const datos =
        resultado.data();


    if (
        datos.activo !== true
    ) {

        throw new Error(
            "LA CUENTA ESTÁ INACTIVA."
        );

    }


    if (
        datos.rol !== "comandante"
        &&
        datos.rol !== "developer"
    ) {

        throw new Error(
            "ESTA CUENTA NO TIENE PERMISOS ADMINISTRATIVOS."
        );

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
            true

    };

}


/* =========================================================
   REAUTENTICAR
========================================================= */

async function reautenticar(
    password
) {

    const usuario =
        auth.currentUser;


    if (!usuario) {

        throw new Error(
            "NO HAY UNA SESIÓN ACTIVA."
        );

    }


    if (!usuario.email) {

        throw new Error(
            "LA CUENTA NO TIENE UN CORREO ASOCIADO."
        );

    }


    const credencial =
        EmailAuthProvider.credential(
            usuario.email,
            password
        );


    await reauthenticateWithCredential(
        usuario,
        credencial
    );

}


/* =========================================================
   ERRORES FIREBASE
========================================================= */

function mensajeError(
    error
) {

    console.error(error);


    switch (
        error.code
    ) {

        case "auth/wrong-password":
        case "auth/invalid-credential":

            return "LA CONTRASEÑA ACTUAL ES INCORRECTA.";


        case "auth/email-already-in-use":

            return "ESE CORREO YA ESTÁ SIENDO UTILIZADO POR OTRA CUENTA.";


        case "auth/invalid-email":

            return "EL CORREO ELECTRÓNICO NO ES VÁLIDO.";


        case "auth/weak-password":

            return "LA NUEVA CONTRASEÑA ES DEMASIADO DÉBIL.";


        case "auth/requires-recent-login":

            return "POR SEGURIDAD, VOLVÉ A INICIAR SESIÓN E INTENTÁ NUEVAMENTE.";


        case "auth/network-request-failed":

            return "NO SE PUDO CONECTAR CON FIREBASE. REVISÁ TU CONEXIÓN.";


        default:

            return error.message
                ||
                "SE PRODUJO UN ERROR.";

    }

}


/* =========================================================
   CAMBIAR EMAIL
========================================================= */

emailForm.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();


        emailMessage.textContent =
            "";


        emailMessage.className =
            "message";


        changeEmailButton.disabled =
            true;


        changeEmailButton.textContent =
            "CAMBIANDO...";


        try {

            const nuevoEmail =
                document
                    .getElementById(
                        "new-email"
                    )
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                document
                    .getElementById(
                        "email-current-password"
                    )
                    .value;


            if (!nuevoEmail) {

                throw new Error(
                    "INGRESÁ EL NUEVO CORREO."
                );

            }


            if (
                nuevoEmail ===
                auth.currentUser.email
            ) {

                throw new Error(
                    "EL NUEVO CORREO ES IGUAL AL ACTUAL."
                );

            }


            /*
            CONFIRMAR IDENTIDAD
            */

            await reautenticar(
                password
            );


            /*
            CAMBIAR EMAIL
            */

            await updateEmail(
                auth.currentUser,
                nuevoEmail
            );


            /*
            ENVIAR VERIFICACIÓN AL NUEVO EMAIL
            */

            try {

                await sendEmailVerification(
                    auth.currentUser
                );

            } catch (verificationError) {

                console.warn(
                    "NO SE PUDO ENVIAR VERIFICACIÓN:",
                    verificationError
                );

            }


            currentEmail.textContent =
                auth.currentUser.email;


            emailMessage.textContent =
                "CORREO CAMBIADO CORRECTAMENTE. SE ENVIÓ UN MENSAJE DE VERIFICACIÓN AL NUEVO CORREO.";


            emailMessage.className =
                "message success";


            emailForm.reset();


        } catch (error) {

            emailMessage.textContent =
                mensajeError(
                    error
                );


            emailMessage.className =
                "message error";


        } finally {

            changeEmailButton.disabled =
                false;


            changeEmailButton.textContent =
                "CAMBIAR CORREO";

        }

    }
);


/* =========================================================
   CAMBIAR CONTRASEÑA
========================================================= */

passwordForm.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();


        passwordMessage.textContent =
            "";


        passwordMessage.className =
            "message";


        changePasswordButton.disabled =
            true;


        changePasswordButton.textContent =
            "CAMBIANDO...";


        try {

            const passwordActual =
                document
                    .getElementById(
                        "password-current"
                    )
                    .value;


            const passwordNueva =
                document
                    .getElementById(
                        "password-new"
                    )
                    .value;


            const passwordRepetida =
                document
                    .getElementById(
                        "password-repeat"
                    )
                    .value;


            if (
                passwordNueva.length < 8
            ) {

                throw new Error(
                    "LA NUEVA CONTRASEÑA DEBE TENER AL MENOS 8 CARACTERES."
                );

            }


            if (
                passwordNueva !==
                passwordRepetida
            ) {

                throw new Error(
                    "LAS CONTRASEÑAS NUEVAS NO COINCIDEN."
                );

            }


            if (
                passwordActual ===
                passwordNueva
            ) {

                throw new Error(
                    "LA NUEVA CONTRASEÑA DEBE SER DIFERENTE A LA ACTUAL."
                );

            }


            /*
            CONFIRMAR IDENTIDAD
            */

            await reautenticar(
                passwordActual
            );


            /*
            CAMBIAR CONTRASEÑA
            */

            await updatePassword(
                auth.currentUser,
                passwordNueva
            );


            passwordMessage.textContent =
                "CONTRASEÑA CAMBIADA CORRECTAMENTE.";


            passwordMessage.className =
                "message success";


            passwordForm.reset();


        } catch (error) {

            passwordMessage.textContent =
                mensajeError(
                    error
                );


            passwordMessage.className =
                "message error";


        } finally {

            changePasswordButton.disabled =
                false;


            changePasswordButton.textContent =
                "CAMBIAR CONTRASEÑA";

        }

    }
);


/* =========================================================
   AUTENTICACIÓN
========================================================= */

onAuthStateChanged(
    auth,
    async usuario => {

        if (!usuario) {

            window.location.replace(
                "./login.html"
            );

            return;

        }


        try {

            loading.textContent =
                "VERIFICANDO PERMISOS...";


            usuarioSistema =
                await obtenerUsuarioAdministrativo(
                    usuario
                );


            /*
            MANTIENE EL MISMO BLOQUEO
            DEL PANEL ADMIN
            */

            const control =
                await tomarControlSistema(
                    usuarioSistema
                );


            if (
                usuarioSistema.rol ===
                "comandante"
                &&
                control.permitido ===
                false
                &&
                control.modo ===
                "developer"
            ) {

                window.location.replace(
                    "./mantenimiento.html"
                );

                return;

            }


            iniciarHeartbeat(
                usuarioSistema
            );


            currentEmail.textContent =
                usuario.email
                ||
                "SIN CORREO";


            currentRole.textContent =
                usuarioSistema.rol
                    .toUpperCase();


            loading.style.display =
                "none";


            accountContent.style.display =
                "block";


            /*
            SI ENTRA DEVELOPER,
            EL COMANDANTE SALE
            */

            detenerEscucha =
                escucharSistema(
                    datos => {

                        if (
                            usuarioSistema.rol ===
                            "comandante"
                            &&
                            datos.modo ===
                            "developer"
                            &&
                            datos.propietarioUid !==
                            usuarioSistema.uid
                        ) {

                            detenerHeartbeat();


                            window.location.replace(
                                "./mantenimiento.html"
                            );

                        }

                    }
                );


        } catch (error) {

            console.error(error);


            loading.textContent =
                `ERROR: ${error.message}`;


            loading.style.display =
                "block";


            accountContent.style.display =
                "none";

        }

    }
);
