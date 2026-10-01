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

const TIEMPO_REENVIO_SEGUNDOS =
    5 * 60;


const CLAVE_REENVIO =
    "sar_password_reset_resend_until";


/* =========================================================
LOGIN
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
RECUPERACIÓN
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
VARIABLES
========================================================= */

let intervaloReenvio =
    null;


let yaSeEnvioCorreo =
    false;


/* =========================================================
MENSAJES
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
CONTADOR
========================================================= */

function formatearTiempo(
    segundos
) {

    const minutos =
        Math.floor(
            segundos / 60
        );


    const segundosRestantes =
        segundos % 60;


    return (
        String(minutos)
            .padStart(
                2,
                "0"
            )
        +
        ":"
        +
        String(segundosRestantes)
            .padStart(
                2,
                "0"
            )
    );

}


function obtenerFinReenvio() {

    const guardado =
        Number(
            localStorage.getItem(
                CLAVE_REENVIO
            )
        );


    if (
        !Number.isFinite(
            guardado
        )
    ) {

        return 0;

    }


    return guardado;

}


function guardarNuevoReenvio() {

    const hasta =
        Date.now()
        +
        TIEMPO_REENVIO_SEGUNDOS
        *
        1000;


    localStorage.setItem(
        CLAVE_REENVIO,
        String(hasta)
    );


    return hasta;

}


function detenerContador() {

    if (
        intervaloReenvio
    ) {

        clearInterval(
            intervaloReenvio
        );


        intervaloReenvio =
            null;

    }

}


function actualizarBotonRecuperacion() {

    const hasta =
        obtenerFinReenvio();


    const restante =
        hasta - Date.now();


    /*
    YA TERMINÓ EL BLOQUEO
    */

    if (
        restante <= 0
    ) {

        detenerContador();


        localStorage.removeItem(
            CLAVE_REENVIO
        );


        resetButton.disabled =
            false;


        if (
            yaSeEnvioCorreo
        ) {

            resetButton.textContent =
                "REENVIAR CORREO";

        } else {

            resetButton.textContent =
                "ENVIAR CORREO DE RECUPERACIÓN";

        }


        return;

    }


    /*
    TODAVÍA ESTÁ BLOQUEADO
    */

    const segundos =
        Math.ceil(
            restante / 1000
        );


    resetButton.disabled =
        true;


    resetButton.textContent =
        `REENVIAR CORREO EN ${formatearTiempo(segundos)}`;

}


function iniciarContador(
    nuevo = false
) {

    detenerContador();


    if (
        nuevo
    ) {

        guardarNuevoReenvio();


        yaSeEnvioCorreo =
            true;

    }


    actualizarBotonRecuperacion();


    if (
        obtenerFinReenvio()
        >
        Date.now()
    ) {

        intervaloReenvio =
            setInterval(
                actualizarBotonRecuperacion,
                1000
            );

    }

}


/* =========================================================
USUARIO ADMINISTRATIVO
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

            return (
                error.message
                ||
                "NO SE PUDO INICIAR SESIÓN."
            );

    }

}


/* =========================================================
LOGIN
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
            passwordInput.value;


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


        /*
        SI EXISTE UN CONTADOR
        LO RESTAURAMOS
        */

        if (
            obtenerFinReenvio()
            >
            Date.now()
        ) {

            yaSeEnvioCorreo =
                true;


            iniciarContador(
                false
            );

        } else {

            resetButton.disabled =
                false;


            resetButton.textContent =
                yaSeEnvioCorreo
                ?
                "REENVIAR CORREO"
                :
                "ENVIAR CORREO DE RECUPERACIÓN";

        }


        setTimeout(
            () => {

                resetEmailInput.focus();

            },
            100
        );

    }
);


/* =========================================================
VOLVER
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


        const email =
            resetEmailInput
                .value
                .trim()
                .toLowerCase();


        if (
            email
        ) {

            emailInput.value =
                email;

        }

    }
);


/* =========================================================
ENVIAR / REENVIAR CORREO
========================================================= */

resetForm.addEventListener(
    "submit",
    async evento => {


        evento.preventDefault();


        /*
        IMPIDE SALTARSE EL CONTADOR
        USANDO ENTER EN EL FORMULARIO
        */

        if (
            obtenerFinReenvio()
            >
            Date.now()
        ) {

            iniciarContador(
                false
            );


            return;

        }


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


            await sendPasswordResetEmail(
                auth,
                email
            );


            mostrarMensaje(
                resetMessage,
                "SI EL CORREO ESTÁ ASOCIADO A UNA CUENTA, RECIBIRÁS UN MENSAJE CON EL ENLACE PARA RESTABLECER TU CONTRASEÑA. SI NO LO ENCONTRÁS EN LA BANDEJA DE ENTRADA, REVISÁ SPAM O CORREO NO DESEADO.",
                "success"
            );


            /*
            BLOQUEAR DURANTE 5 MINUTOS
            */

            iniciarContador(
                true
            );


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


                resetButton.disabled =
                    false;


                resetButton.textContent =
                    "ENVIAR CORREO DE RECUPERACIÓN";


                return;

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


                resetButton.disabled =
                    false;


                resetButton.textContent =
                    "ENVIAR CORREO DE RECUPERACIÓN";


                return;

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


                resetButton.disabled =
                    false;


                resetButton.textContent =
                    "ENVIAR CORREO DE RECUPERACIÓN";


                return;

            }


            /*
            NO REVELAMOS SI LA CUENTA EXISTE.
            */

            mostrarMensaje(
                resetMessage,
                "SI EL CORREO ESTÁ ASOCIADO A UNA CUENTA, RECIBIRÁS UN MENSAJE CON EL ENLACE PARA RESTABLECER TU CONTRASEÑA. SI NO LO ENCONTRÁS EN LA BANDEJA DE ENTRADA, REVISÁ SPAM O CORREO NO DESEADO.",
                "success"
            );


            iniciarContador(
                true
            );

        }

    }
);


/* =========================================================
RESTAURAR ESTADO AL CARGAR
========================================================= */

if (
    obtenerFinReenvio()
    >
    Date.now()
) {

    yaSeEnvioCorreo =
        true;


    iniciarContador(
        false
    );

} else {

    localStorage.removeItem(
        CLAVE_REENVIO
    );


    resetButton.disabled =
        false;


    resetButton.textContent =
        "ENVIAR CORREO DE RECUPERACIÓN";

}
