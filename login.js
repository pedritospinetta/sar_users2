import {
    auth,
    db
} from "./firebase-config.js";


import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


import {
    tomarControlSistema
} from "./sistema.js";


/* =========================================================
CONFIGURACIÓN
========================================================= */

const RESEND_SECONDS =
    5 * 60;


const RESEND_STORAGE_KEY =
    "sar_password_reset_resend_until";


/* =========================================================
ELEMENTOS LOGIN
========================================================= */

const loginForm =
    document.getElementById(
        "login-form"
    );


const emailInput =
    document.getElementById(
        "email"
    );


const passwordInput =
    document.getElementById(
        "password"
    );


const loginButton =
    document.getElementById(
        "login-button"
    );


const loginMessage =
    document.getElementById(
        "login-message"
    );


const loginPanel =
    document.getElementById(
        "login-panel"
    );


/* =========================================================
ELEMENTOS RECUPERACIÓN
========================================================= */

const forgotPasswordButton =
    document.getElementById(
        "forgot-password"
    );


const resetPanel =
    document.getElementById(
        "reset-panel"
    );


const resetForm =
    document.getElementById(
        "reset-form"
    );


const resetEmailInput =
    document.getElementById(
        "reset-email"
    );


const resetButton =
    document.getElementById(
        "reset-button"
    );


const resetMessage =
    document.getElementById(
        "reset-message"
    );


const resendResetButton =
    document.getElementById(
        "resend-reset"
    );


const backToLoginButton =
    document.getElementById(
        "back-to-login"
    );


/* =========================================================
VARIABLES
========================================================= */

let resendInterval =
    null;


/* =========================================================
UTILIDADES
========================================================= */

function limpiarMensaje(
    elemento
) {

    elemento.textContent =
        "";


    elemento.className =
        "message";

}


function mostrarMensaje(
    elemento,
    texto,
    tipo = "info"
) {

    elemento.textContent =
        texto;


    elemento.className =
        `message ${tipo}`;

}


/* =========================================================
FORMATEAR CONTADOR
========================================================= */

function formatearTiempo(
    segundos
) {

    const minutos =
        Math.floor(
            segundos / 60
        );


    const restoSegundos =
        segundos % 60;


    return (
        String(minutos)
            .padStart(2, "0")
        +
        ":"
        +
        String(restoSegundos)
            .padStart(2, "0")
    );

}


/* =========================================================
OBTENER FIN DEL CONTADOR
========================================================= */

function obtenerFinReenvio() {

    const valor =
        localStorage.getItem(
            RESEND_STORAGE_KEY
        );


    const timestamp =
        Number(valor);


    if (
        !Number.isFinite(timestamp)
    ) {

        return 0;

    }


    return timestamp;

}


/* =========================================================
GUARDAR FIN DEL CONTADOR
========================================================= */

function guardarFinReenvio() {

    const hasta =
        Date.now()
        +
        RESEND_SECONDS * 1000;


    localStorage.setItem(
        RESEND_STORAGE_KEY,
        String(hasta)
    );


    return hasta;

}


/* =========================================================
DETENER CONTADOR
========================================================= */

function detenerContador() {

    if (
        resendInterval
    ) {

        clearInterval(
            resendInterval
        );


        resendInterval =
            null;

    }

}


/* =========================================================
ACTUALIZAR CONTADOR
========================================================= */

function actualizarContador() {

    const hasta =
        obtenerFinReenvio();


    const restanteMs =
        hasta - Date.now();


    if (
        restanteMs <= 0
    ) {

        detenerContador();


        localStorage.removeItem(
            RESEND_STORAGE_KEY
        );


        resendResetButton.disabled =
            false;


        resendResetButton.textContent =
            "REENVIAR CORREO";


        return;

    }


    const restanteSegundos =
        Math.ceil(
            restanteMs / 1000
        );


    resendResetButton.disabled =
        true;


    resendResetButton.textContent =
        `REENVIAR CORREO EN ${formatearTiempo(restanteSegundos)}`;

}


/* =========================================================
INICIAR CONTADOR
========================================================= */

function iniciarContador(
    guardarNuevo = false
) {

    detenerContador();


    if (
        guardarNuevo
    ) {

        guardarFinReenvio();

    }


    actualizarContador();


    const hasta =
        obtenerFinReenvio();


    if (
        hasta > Date.now()
    ) {

        resendInterval =
            setInterval(
                actualizarContador,
                1000
            );

    }

}


/* =========================================================
OBTENER USUARIO ADMINISTRATIVO
========================================================= */

async function obtenerUsuarioAdministrativo(
    usuario
) {

    const referencia =
        doc(
            db,
            "usuarios",
            usuario.uid
        );


    const resultado =
        await getDoc(
            referencia
        );


    if (
        !resultado.exists()
    ) {

        throw new Error(
            "NO EXISTE EL REGISTRO ADMINISTRATIVO DE ESTE USUARIO."
        );

    }


    const datos =
        resultado.data();


    if (
        datos.activo !== true
    ) {

        throw new Error(
            "LA CUENTA ADMINISTRATIVA ESTÁ INACTIVA."
        );

    }


    if (
        datos.rol !== "comandante"
        &&
        datos.rol !== "developer"
    ) {

        throw new Error(
            "ESTE USUARIO NO TIENE PERMISOS ADMINISTRATIVOS."
        );

    }


    return {

        uid:
            usuario.uid,

        email:
            usuario.email || "",

        nombre:
            datos.nombre || "",

        rol:
            datos.rol,

        activo:
            datos.activo

    };

}


/* =========================================================
ERRORES LOGIN
========================================================= */

function obtenerMensajeLogin(
    error
) {

    console.error(
        "ERROR LOGIN:",
        error
    );


    switch (
        error.code
    ) {

        case "auth/invalid-email":

            return "EL CORREO ELECTRÓNICO NO ES VÁLIDO.";


        case "auth/invalid-credential":

        case "auth/wrong-password":

        case "auth/user-not-found":

            return "CORREO O CONTRASEÑA INCORRECTOS.";


        case "auth/user-disabled":

            return "ESTA CUENTA FUE DESHABILITADA.";


        case "auth/too-many-requests":

            return "SE REALIZARON DEMASIADOS INTENTOS. ESPERÁ UN MOMENTO E INTENTÁ NUEVAMENTE.";


        case "auth/network-request-failed":

            return "NO SE PUDO CONECTAR CON FIREBASE. REVISÁ TU CONEXIÓN.";


        default:

            return error.message
                ||
                "NO SE PUDO INICIAR SESIÓN.";

    }

}


/* =========================================================
INICIAR SESIÓN
========================================================= */

loginForm.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();


        limpiarMensaje(
            loginMessage
        );


        const email =
            emailInput
                .value
                .trim()
                .toLowerCase();


        const password =
            passwordInput
                .value;


        if (
            !email
            ||
            !password
        ) {

            mostrarMensaje(
                loginMessage,
                "INGRESÁ TU CORREO Y CONTRASEÑA.",
                "error"
            );

            return;

        }


        loginButton.disabled =
            true;


        loginButton.textContent =
            "VERIFICANDO...";


        try {


            const credencial =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const usuario =
                credencial.user;


            const usuarioSistema =
                await obtenerUsuarioAdministrativo(
                    usuario
                );


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

                await signOut(
                    auth
                );


                window.location.replace(
                    "./mantenimiento.html"
                );


                return;

            }


            sessionStorage.setItem(
                "sar_admin_role",
                usuarioSistema.rol
            );


            sessionStorage.setItem(
                "sar_admin_name",
                usuarioSistema.nombre
            );


            window.location.replace(
                "./admin.html"
            );


        } catch (error) {


            if (
                auth.currentUser
            ) {

                try {

                    await signOut(
                        auth
                    );

                } catch {}

            }


            mostrarMensaje(
                loginMessage,
                obtenerMensajeLogin(
                    error
                ),
                "error"
            );


        } finally {


            loginButton.disabled =
                false;


            loginButton.textContent =
                "INICIAR SESIÓN";

        }

    }
);


/* =========================================================
ABRIR RECUPERACIÓN
========================================================= */

forgotPasswordButton.addEventListener(
    "click",
    () => {


        limpiarMensaje(
            loginMessage
        );


        limpiarMensaje(
            resetMessage
        );


        const emailActual =
            emailInput
                .value
                .trim()
                .toLowerCase();


        if (
            emailActual
        ) {

            resetEmailInput.value =
                emailActual;

        }


        loginPanel.classList.add(
            "hidden"
        );


        resetPanel.classList.add(
            "visible"
        );


        document.title =
            "Recuperar contraseña | SAR Argentina";


        iniciarContador(
            false
        );


        setTimeout(
            () => {

                resetEmailInput.focus();

            },
            100
        );

    }
);


/* =========================================================
VOLVER AL LOGIN
========================================================= */

backToLoginButton.addEventListener(
    "click",
    () => {


        limpiarMensaje(
            resetMessage
        );


        resetPanel.classList.remove(
            "visible"
        );


        loginPanel.classList.remove(
            "hidden"
        );


        document.title =
            "Acceso Administrativo | SAR Argentina";


        const emailRecuperacion =
            resetEmailInput
                .value
                .trim()
                .toLowerCase();


        if (
            emailRecuperacion
        ) {

            emailInput.value =
                emailRecuperacion;

        }

    }
);


/* =========================================================
ENVIAR CORREO
========================================================= */

async function enviarCorreoRecuperacion(
    esReenvio = false
) {

    limpiarMensaje(
        resetMessage
    );


    const email =
        resetEmailInput
            .value
            .trim()
            .toLowerCase();


    if (
        !email
    ) {

        mostrarMensaje(
            resetMessage,
            "INGRESÁ TU CORREO ELECTRÓNICO.",
            "error"
        );

        return false;

    }


    resetButton.disabled =
        true;


    resendResetButton.disabled =
        true;


    if (
        esReenvio
    ) {

        resendResetButton.textContent =
            "REENVIANDO...";

    } else {

        resetButton.textContent =
            "ENVIANDO...";

    }


    try {


        await sendPasswordResetEmail(
            auth,
            email
        );


        mostrarMensaje(
            resetMessage,
            "SI EL CORREO ESTÁ ASOCIADO A UNA CUENTA, RECIBIRÁS UN MENSAJE CON EL ENLACE PARA RESTABLECER TU CONTRASEÑA. SI NO LO ENCONTRÁS EN LA BANDEJA DE ENTRADA, REVISÁ SPAM O CORREO NO DESEADO.",
            "success"
        );


        iniciarContador(
            true
        );


        return true;


    } catch (error) {


        console.error(
            "ERROR RECUPERACIÓN:",
            error
        );


        if (
            error.code ===
            "auth/invalid-email"
        ) {

            mostrarMensaje(
                resetMessage,
                "EL CORREO ELECTRÓNICO NO ES VÁLIDO.",
                "error"
            );


            resendResetButton.disabled =
                false;


            resendResetButton.textContent =
                "REENVIAR CORREO";


            return false;

        }


        if (
            error.code ===
            "auth/too-many-requests"
        ) {

            mostrarMensaje(
                resetMessage,
                "SE REALIZARON DEMASIADAS SOLICITUDES. ESPERÁ UN MOMENTO E INTENTÁ NUEVAMENTE.",
                "error"
            );


            return false;

        }


        if (
            error.code ===
            "auth/network-request-failed"
        ) {

            mostrarMensaje(
                resetMessage,
                "NO SE PUDO CONECTAR CON FIREBASE. REVISÁ TU CONEXIÓN.",
                "error"
            );


            return false;

        }


        mostrarMensaje(
            resetMessage,
            "SI EL CORREO ESTÁ ASOCIADO A UNA CUENTA, RECIBIRÁS UN MENSAJE CON EL ENLACE PARA RESTABLECER TU CONTRASEÑA. SI NO LO ENCONTRÁS EN LA BANDEJA DE ENTRADA, REVISÁ SPAM O CORREO NO DESEADO.",
            "success"
        );


        iniciarContador(
            true
        );


        return true;


    } finally {


        resetButton.disabled =
            false;


        resetButton.textContent =
            "ENVIAR CORREO DE RECUPERACIÓN";

    }

}


/* =========================================================
PRIMER ENVÍO
========================================================= */

resetForm.addEventListener(
    "submit",
    async evento => {


        evento.preventDefault();


        await enviarCorreoRecuperacion(
            false
        );

    }
);


/* =========================================================
REENVIAR
========================================================= */

resendResetButton.addEventListener(
    "click",
    async () => {


        const hasta =
            obtenerFinReenvio();


        if (
            hasta > Date.now()
        ) {

            iniciarContador(
                false
            );

            return;

        }


        await enviarCorreoRecuperacion(
            true
        );

    }
);


/* =========================================================
RESTAURAR CONTADOR AL CARGAR
========================================================= */

const finGuardado =
    obtenerFinReenvio();


if (
    finGuardado > Date.now()
) {

    iniciarContador(
        false
    );

} else {

    localStorage.removeItem(
        RESEND_STORAGE_KEY
    );


    resendResetButton.disabled =
        false;


    resendResetButton.textContent =
        "REENVIAR CORREO";

}
