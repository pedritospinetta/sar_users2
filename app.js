import {
    db
} from "./firebase-config.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


import {
    obtenerEstadoSistema,
    escucharSistema
} from "./sistema.js";


/* =========================================
CONFIGURACIÓN DEL SISTEMA
========================================= */

const TIEMPO_VENCIMIENTO =
    5 * 60 * 1000;


/* =========================================
VARIABLES
========================================= */

let integrantes = [];

let redireccionando = false;


/* =========================================
ELEMENTOS
========================================= */

const lista =
    document.getElementById(
        "lista-integrantes"
    );


const buscador =
    document.getElementById(
        "buscador"
    );


const cantidad =
    document.getElementById(
        "cantidad"
    );


const totalIntegrantes =
    document.getElementById(
        "total-integrantes"
    );


/* =========================================
UTILIDADES
========================================= */

function mayusculas(valor) {

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


function escapar(valor) {

    return String(
        valor
        ??
        ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================
COMPROBAR SI EL BLOQUEO SIGUE VIGENTE
========================================= */

function bloqueoVigente(datos) {

    if (!datos) {

        return false;

    }


    if (
        datos.modo === "online"
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
REDIRECCIÓN SEGÚN MODO
========================================= */

function aplicarEstadoSistema(datos) {

    if (redireccionando) {

        return false;

    }


    if (
        !bloqueoVigente(datos)
    ) {

        return true;

    }


    /* =====================================
    DEVELOPER
    ===================================== */

    if (
        datos.modo === "developer"
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
        datos.modo === "comandante"
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
COMPROBAR ESTADO INICIAL
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
            "ERROR CONSULTANDO ESTADO DEL SISTEMA:",
            error
        );


        /*
        SI FIREBASE NO PUEDE CONSULTAR
        EL ESTADO, NO MOSTRAMOS DATOS
        HASTA SABER QUÉ PASA.
        */

        if (lista) {

            lista.innerHTML = `

                <div class="no-results">

                    NO SE PUDO VERIFICAR
                    EL ESTADO DEL SISTEMA.

                    <br><br>

                    INTENTÁ NUEVAMENTE
                    EN UNOS INSTANTES.

                </div>

            `;

        }


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
CARGAR INTEGRANTES
========================================= */

async function cargarIntegrantes() {

    if (!lista) {

        return;

    }


    lista.innerHTML = `

        <div class="no-results">

            CARGANDO INTEGRANTES...

        </div>

    `;


    try {

        const resultado =
            await getDocs(
                collection(
                    db,
                    "integrantes"
                )
            );


        const todos =
            resultado.docs.map(
                documento => ({

                    id:
                        documento.id,

                    ...documento.data()

                })
            );


        /* =====================================
        SOLO ACTIVOS EN LA PÁGINA PÚBLICA
        ===================================== */

        integrantes =
            todos.filter(
                persona => {

                    const estado =
                        String(
                            persona.estado
                            ||
                            ""
                        )
                            .toLowerCase()
                            .trim();


                    return (
                        estado === "activo"
                    );

                }
            );


        /* =====================================
        ORDENAR SAR-001, SAR-002...
        ===================================== */

        integrantes.sort(
            (a, b) =>

                String(
                    a.id
                )
                    .localeCompare(

                        String(
                            b.id
                        ),

                        undefined,

                        {
                            numeric:
                                true
                        }

                    )
        );


        if (
            totalIntegrantes
        ) {

            totalIntegrantes.textContent =
                integrantes.length;

        }


        mostrarIntegrantes(
            integrantes
        );


    } catch (error) {

        console.error(
            "ERROR CARGANDO INTEGRANTES:",
            error
        );


        lista.innerHTML = `

            <div class="no-results">

                NO SE PUDO CARGAR EL REGISTRO
                DE INTEGRANTES.

            </div>

        `;


        if (
            cantidad
        ) {

            cantidad.textContent =
                "ERROR";

        }


        if (
            totalIntegrantes
        ) {

            totalIntegrantes.textContent =
                "—";

        }

    }

}


/* =========================================
MOSTRAR INTEGRANTES
========================================= */

function mostrarIntegrantes(datos) {

    if (!lista) {

        return;

    }


    lista.innerHTML =
        "";


    if (
        cantidad
    ) {

        cantidad.textContent =
            `${datos.length} integrante${
                datos.length !== 1
                    ?
                    "s"
                    :
                    ""
            }`;

    }


    if (
        datos.length === 0
    ) {

        lista.innerHTML = `

            <div class="no-results">

                NO SE ENCONTRARON
                INTEGRANTES ACTIVOS.

            </div>

        `;


        return;

    }


    datos.forEach(
        persona => {

            const foto =
                persona.fotoUrl
                ||
                "./img/logo.jpg";


            const tarjeta =
                document.createElement(
                    "article"
                );


            tarjeta.className =
                "member-card";


            tarjeta.innerHTML = `

                <img
                    class="member-photo"
                    src="${escapar(foto)}"
                    alt=""
                    loading="lazy"
                >


                <div class="member-info">


                    <div class="member-id">

                        ${escapar(
                            mayusculas(
                                persona.id
                            )
                        )}

                    </div>


                    <h3 class="member-name">

                        ${escapar(
                            mayusculas(
                                persona.nombre
                                ||
                                "SIN NOMBRE"
                            )
                        )}

                    </h3>


                    <div class="member-role">

                        ${escapar(
                            mayusculas(
                                persona.cargo
                                ||
                                "SIN FUNCIÓN"
                            )
                        )}

                    </div>


                    <div class="status activo">

                        <span
                            class="status-dot"
                        ></span>

                        MIEMBRO ACTIVO

                    </div>


                    <a
                        class="view-button"
                        href="./integrante.html?id=${encodeURIComponent(persona.id)}"
                    >

                        VER FICHA

                    </a>


                </div>

            `;


            const imagen =
                tarjeta.querySelector(
                    ".member-photo"
                );


            imagen.addEventListener(
                "error",
                () => {

                    imagen.src =
                        "./img/logo.jpg";

                },
                {
                    once:
                        true
                }
            );


            lista.appendChild(
                tarjeta
            );

        }
    );

}


/* =========================================
BUSCADOR
========================================= */

if (
    buscador
) {

    buscador.addEventListener(
        "input",
        () => {

            const texto =
                mayusculas(
                    buscador.value
                );


            const resultados =
                integrantes.filter(
                    persona => {

                        const especialidades =
                            Array.isArray(
                                persona.especialidades
                            )
                                ?
                                persona.especialidades.join(
                                    " "
                                )
                                :
                                "";


                        const contenido =
                            [

                                persona.id,
                                persona.nombre,
                                persona.cargo,
                                persona.delegacion,
                                especialidades

                            ]
                                .join(
                                    " "
                                )
                                .toLocaleUpperCase(
                                    "es-AR"
                                );


                        return contenido.includes(
                            texto
                        );

                    }
                );


            mostrarIntegrantes(
                resultados
            );

        }
    );

}


/* =========================================
INICIAR
========================================= */

async function iniciar() {

    /*
    PRIMERO COMPROBAMOS SI
    LA PÁGINA PÚBLICA ESTÁ HABILITADA
    */

    const permitido =
        await verificarSistema();


    if (!permitido) {

        return;

    }


    /*
    ESCUCHAMOS CAMBIOS.
    SI EL COMANDANTE O DEVELOPER
    ENTRAN MIENTRAS ALGUIEN TIENE
    ABIERTA LA WEB, TAMBIÉN SE REDIRIGE.
    */

    vigilarSistema();


    /*
    RECIÉN AHORA CARGAMOS
    LOS INTEGRANTES
    */

    await cargarIntegrantes();

}


iniciar();
