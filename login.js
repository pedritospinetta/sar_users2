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


const backToLoginButton =
    document.getElementById(
        "back-to-login"
    );


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


            /* =========================================
            LOGIN FIREBASE
            ========================================= */

            const credencial =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const usuario =
                credencial.user;


            /* =========================================
            VERIFICAR ROL
            ========================================= */

            const usuarioSistema =
                await obtenerUsuarioAdministrativo(
                    usuario
                );


            /* =========================================
            TOMAR CONTROL DEL SISTEMA
            ========================================= */

            const control =
                await tomarControlSistema(
                    usuarioSistema
                );


            /*
            SI ES COMANDANTE Y HAY UN
            DEVELOPER TRABAJANDO, NO ENTRA.
            */

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


            /* =========================================
            DATOS DE SESIÓN
            ========================================= */

            sessionStorage.setItem(
                "sar_admin_role",
                usuarioSistema.rol
            );


            sessionStorage.setItem(
                "sar_admin_name",
                usuarioSistema.nombre
            );


            /* =========================================
            ENTRAR AL PANEL
            ========================================= */

            window.location.replace(
                "./admin.html"
            );


        } catch (error) {


            /*
            SI ALCANZÓ A INICIAR SESIÓN
            PERO FALLÓ LA AUTORIZACIÓN,
            CERRAMOS LA SESIÓN.
            */

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


        /*
        SI YA ESCRIBIÓ UN CORREO EN LOGIN,
        LO COPIAMOS AUTOMÁTICAMENTE.
        */

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


        /*
        SI ESCRIBIÓ EL EMAIL EN RECUPERACIÓN,
        LO PASAMOS AL LOGIN.
        */

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
ENVIAR CORREO DE RECUPERACIÓN
========================================================= */

resetForm.addEventListener(
    "submit",
    async evento => {


        evento.preventDefault();


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

            return;

        }


        resetButton.disabled =
            true;


        resetButton.textContent =
            "ENVIANDO...";


        try {


            /*
            FIREBASE ENVÍA AUTOMÁTICAMENTE
            EL EMAIL USANDO LA PLANTILLA
            QUE CONFIGURASTE EN LA CONSOLA.
            */

            await sendPasswordResetEmail(
                auth,
                email
            );


            /*
            POR SEGURIDAD NO CONFIRMAMOS
            SI EL CORREO EXISTE O NO.
            */

            mostrarMensaje(
                resetMessage,
                "SI EL CORREO ESTÁ ASOCIADO A UNA CUENTA, RECIBIRÁS UN MENSAJE CON EL ENLACE PARA RESTABLECER TU CONTRASEÑA. SI NO LO ENCONTRÁS EN LA BANDEJA DE ENTRADA, REVISÁ SPAM O CORREO NO DESEADO.",
                "success"
            );


            resetButton.textContent =
                "CORREO SOLICITADO";


        } catch (error) {


            console.error(
                "ERROR RECUPERACIÓN:",
                error
            );


            /*
            EN MUCHOS CASOS CONVIENE MOSTRAR
            EL MISMO MENSAJE PARA NO REVELAR
            QUÉ CORREOS ESTÁN REGISTRADOS.
            */

            if (
                error.code ===
                "auth/invalid-email"
            ) {

                mostrarMensaje(
                    resetMessage,
                    "EL CORREO ELECTRÓNICO NO ES VÁLIDO.",
                    "error"
                );

            }

            else if (
                error.code ===
                "auth/too-many-requests"
            ) {

                mostrarMensaje(
                    resetMessage,
                    "SE REALIZARON DEMASIADAS SOLICITUDES. ESPERÁ UN MOMENTO E INTENTÁ NUEVAMENTE.",
                    "error"
                );

            }

            else if (
                error.code ===
                "auth/network-request-failed"
            ) {

                mostrarMensaje(
                    resetMessage,
                    "NO SE PUDO CONECTAR CON FIREBASE. REVISÁ TU CONEXIÓN.",
                    "error"
                );

            }

            else {

                /*
                NO REVELAMOS SI EL EMAIL EXISTE.
                */

                mostrarMensaje(
                    resetMessage,
                    "SI EL CORREO ESTÁ ASOCIADO A UNA CUENTA, RECIBIRÁS UN MENSAJE CON EL ENLACE PARA RESTABLECER TU CONTRASEÑA.",
                    "success"
                );

            }


        } finally {


            resetButton.disabled =
                false;


            if (
                resetButton.textContent !==
                "CORREO SOLICITADO"
            ) {

                resetButton.textContent =
                    "ENVIAR CORREO DE RECUPERACIÓN";

            }

        }

    }
);
