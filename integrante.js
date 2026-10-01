import {
    db
} from "./firebase-config.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


import {
    obtenerEstadoSistema,
    escucharSistema
} from "./sistema.js";


/* =========================================
CONFIGURACIÓN
========================================= */

const TIEMPO_VENCIMIENTO =
    5 * 60 * 1000;


/* =========================================
ELEMENTOS
========================================= */

const loading =
    document.getElementById(
        "loading"
    );


const profile =
    document.getElementById(
        "profile"
    );


const inactive =
    document.getElementById(
        "inactive"
    );


const notFound =
    document.getElementById(
        "not-found"
    );


/* =========================================
ID DESDE URL
========================================= */

const parametros =
    new URLSearchParams(
        window.location.search
    );


const id =
    String(
        parametros.get("id")
        ||
        ""
    )
        .trim()
        .toUpperCase();


/* =========================================
VARIABLES
========================================= */

let redireccionando =
    false;


/* =========================================
SISTEMA
========================================= */

function bloqueoVigente(
    datos
) {

    if (!datos) {

        return false;

    }


    if (
        datos.modo ===
        "online"
    ) {

        return false;

    }


    const ultimaActividad =
        datos.ultimaActividad
            ?.toMillis?.();


    if (!ultimaActividad) {

        return false;

    }


    return (
        Date.now() - ultimaActividad
        <=
        TIEMPO_VENCIMIENTO
    );

}


/* =========================================
APLICAR ESTADO DEL SISTEMA
========================================= */

function aplicarEstadoSistema(
    datos
) {

    if (
        redireccionando
    ) {

        return false;

    }


    if (
        !bloqueoVigente(
            datos
        )
    ) {

        return true;

    }


    /* =====================================
    DEVELOPER
    ===================================== */

    if (
        datos.modo ===
        "developer"
    ) {

        redireccionando =
            true;


        window.location.replace(
            "./mantenimiento.html"
        );


        return false;

    }


    /* =====================================
    COMANDANTE
    ===================================== */

    if (
        datos.modo ===
        "comandante"
    ) {

        redireccionando =
            true;


        window.location.replace(
            "./actualizacion.html"
        );


        return false;

    }


    return true;

}


/* =========================================
VERIFICAR SISTEMA
========================================= */

async function verificarSistema() {

    try {

        const estado =
            await obtenerEstadoSistema();


        return aplicarEstadoSistema(
            estado
        );


    } catch (error) {

        console.error(
            "ERROR VERIFICANDO ESTADO DEL SISTEMA:",
            error
        );


        ocultarTodo();


        loading.style.display =
            "block";


        loading.textContent =
            "NO SE PUDO VERIFICAR EL ESTADO DEL SISTEMA.";


        return false;

    }

}


/* =========================================
ESCUCHAR CAMBIOS EN TIEMPO REAL
========================================= */

function vigilarSistema() {

    escucharSistema(
        datos => {

            aplicarEstadoSistema(
                datos
            );

        }
    );

}


/* =========================================
CARGAR INTEGRANTE
========================================= */

async function cargar() {

    /*
    PRIMERO SE VERIFICA EL SISTEMA
    */

    const permitido =
        await verificarSistema();


    if (!permitido) {

        return;

    }


    /*
    SE ESCUCHAN CAMBIOS EN TIEMPO REAL
    */

    vigilarSistema();


    /*
    RECIÉN DESPUÉS SE CONSULTA EL INTEGRANTE
    */

    if (!id) {

        mostrarNoRegistrado();

        return;

    }


    try {

        const resultado =
            await getDoc(
                doc(
                    db,
                    "integrantes",
                    id
                )
            );


        if (!resultado.exists()) {

            mostrarNoRegistrado();

            return;

        }


        const persona = {

            id:
                resultado.id,

            ...resultado.data()

        };


        const estado =
            String(
                persona.estado
                ||
                "inactivo"
            )
                .toLowerCase()
                .trim();


        if (
            estado !==
            "activo"
        ) {

            mostrarInactivo(
                persona
            );

            return;

        }


        mostrarActivo(
            persona
        );


    } catch (error) {

        console.error(
            "ERROR CONSULTANDO INTEGRANTE:",
            error
        );


        /*
        IMPORTANTE:
        NO MOSTRAMOS "NO REGISTRADO"
        SI FIREBASE FALLÓ.
        */

        ocultarTodo();


        loading.style.display =
            "block";


        loading.textContent =
            "NO SE PUDO CONSULTAR EL REGISTRO. INTENTÁ NUEVAMENTE EN UNOS INSTANTES.";


        document.title =
            "Error de consulta | SAR Argentina";

    }

}


/* =========================================
OCULTAR TODO
========================================= */

function ocultarTodo() {

    loading.style.display =
        "none";

    profile.style.display =
        "none";

    inactive.style.display =
        "none";

    notFound.style.display =
        "none";

}


/* =========================================
NO REGISTRADO
========================================= */

function mostrarNoRegistrado() {

    ocultarTodo();


    notFound.style.display =
        "block";


    document.getElementById(
        "not-found-id"
    ).textContent =
        id
        ||
        "IDENTIFICACIÓN NO ESPECIFICADA";


    document.title =
        "Usuario no registrado | SAR Argentina";

}


/* =========================================
INACTIVO
========================================= */

function mostrarInactivo(
    persona
) {

    ocultarTodo();


    inactive.style.display =
        "block";


    document.getElementById(
        "inactive-id"
    ).textContent =
        persona.id;


    document.getElementById(
        "inactive-name"
    ).textContent =
        persona.nombre
        ||
        "";


    document.title =
        "Credencial no vigente | SAR Argentina";

}


/* =========================================
ACTIVO
========================================= */

function mostrarActivo(
    persona
) {

    ocultarTodo();


    profile.style.display =
        "block";


    const foto =
        persona.fotoUrl
        ||
        "./img/logo.jpg";


    const imagen =
        document.getElementById(
            "profile-photo"
        );


    imagen.src =
        foto;


    imagen.onerror =
        () => {

            imagen.src =
                "./img/logo.jpg";

        };


    document.getElementById(
        "profile-id"
    ).textContent =
        persona.id;


    document.getElementById(
        "profile-name"
    ).textContent =
        mayusculas(
            persona.nombre
        );


    const cargo =
        mayusculas(
            persona.cargo
        );


    const cargoElemento =
        document.getElementById(
            "profile-role"
        );


    cargoElemento.textContent =
        cargo;


    cargoElemento.classList.remove(
        "commander-role"
    );


    if (
        cargo ===
        "COMANDANTE"
    ) {

        cargoElemento.classList.add(
            "commander-role"
        );

    }


    campo(
        "dni-box",
        "dni",
        persona.dni
    );


    campo(
        "blood-box",
        "blood",
        persona.grupoSanguineo
    );


    campo(
        "delegation-box",
        "delegation",
        persona.delegacion
    );


    campo(
        "entry-box",
        "entry",
        persona.ingreso
    );


    mostrarTags(
        "specialties-section",
        "specialties",
        persona.especialidades
    );


    mostrarTags(
        "affiliations-section",
        "affiliations",
        persona.afiliaciones
    );


    mostrarEmergencia(
        persona
    );


    document.title =
        `${mayusculas(persona.nombre)} | SAR Argentina`;

}


/* =========================================
EMERGENCIA
========================================= */

function mostrarEmergencia(
    persona
) {

    const seccion =
        document.getElementById(
            "emergency-section"
        );


    if (
        persona.publicarEmergencia
        !== true
    ) {

        seccion.style.display =
            "none";

        return;

    }


    seccion.style.display =
        "block";


    const alergias =
        Array.isArray(
            persona.alergias
        )
            ?
            persona.alergias
                .map(mayusculas)
            :
            [];


    document.getElementById(
        "allergies-line"
    ).textContent =
        alergias.length
            ?
            `ALERGIAS: ${alergias.join(", ")}`
            :
            "ALERGIAS: NO INFORMADAS";


    document.getElementById(
        "blood-donor-line"
    ).textContent =
        persona.donanteSangre === true
            ?
            "DONANTE DE SANGRE: SÍ"
            :
            "DONANTE DE SANGRE: NO / NO INFORMADO";


    document.getElementById(
        "organ-donor-line"
    ).textContent =
        persona.donanteOrganos === true
            ?
            "DONANTE DE ÓRGANOS / INCUCAI: SÍ"
            :
            "DONANTE DE ÓRGANOS / INCUCAI: NO / NO INFORMADO";

}


/* =========================================
TAGS
========================================= */

function mostrarTags(
    sectionId,
    containerId,
    valores
) {

    const seccion =
        document.getElementById(
            sectionId
        );


    const contenedor =
        document.getElementById(
            containerId
        );


    contenedor.innerHTML =
        "";


    if (
        !Array.isArray(
            valores
        )
        ||
        valores.length === 0
    ) {

        seccion.style.display =
            "none";

        return;

    }


    seccion.style.display =
        "block";


    valores.forEach(
        valor => {

            const tag =
                document.createElement(
                    "span"
                );


            tag.className =
                "tag";


            tag.textContent =
                mayusculas(
                    valor
                );


            contenedor.appendChild(
                tag
            );

        }
    );

}


/* =========================================
CAMPO
========================================= */

function campo(
    cajaId,
    valorId,
    valor
) {

    const caja =
        document.getElementById(
            cajaId
        );


    if (
        valor === undefined
        ||
        valor === null
        ||
        String(valor).trim() === ""
    ) {

        caja.style.display =
            "none";

        return;

    }


    caja.style.display =
        "block";


    document.getElementById(
        valorId
    ).textContent =
        mayusculas(
            valor
        );

}


/* =========================================
MAYÚSCULAS
========================================= */

function mayusculas(
    valor
) {

    return String(
        valor
        ||
        ""
    )
        .trim()
        .toLocaleUpperCase(
            "es-AR"
        );

}


/* =========================================
INICIAR
========================================= */

cargar();
