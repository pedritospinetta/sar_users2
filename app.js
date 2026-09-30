import {
    db
} from "./firebase-config.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


let integrantes = [];


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



async function cargarIntegrantes() {

    lista.innerHTML = `

        <div class="no-results">
            Cargando integrantes...
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


        const todos = [];


        resultado.forEach(
            documento => {

                todos.push({

                    id:
                        documento.id,

                    ...documento.data()

                });

            }
        );


        /* =========================================
        SOLO ACTIVOS EN LA PÁGINA PÚBLICA
        ========================================= */


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


        integrantes.sort(
            (a, b) =>

                String(a.id)
                    .localeCompare(

                        String(b.id),

                        undefined,

                        {
                            numeric: true
                        }

                    )
        );


        totalIntegrantes.textContent =
            integrantes.length;


        mostrarIntegrantes(
            integrantes
        );


    } catch (error) {

        console.error(
            "Error cargando integrantes:",
            error
        );


        lista.innerHTML = `

            <div class="no-results">

                No se pudo cargar
                el registro de integrantes.

            </div>

        `;


        cantidad.textContent =
            "Error";

    }

}



function mostrarIntegrantes(
    datos
) {

    lista.innerHTML =
        "";


    cantidad.textContent =
        `${datos.length} integrante${
            datos.length !== 1
                ? "s"
                : ""
        }`;


    if (
        datos.length === 0
    ) {

        lista.innerHTML = `

            <div class="no-results">

                No se encontraron
                integrantes activos.

            </div>

        `;

        return;

    }


    datos.forEach(
        persona => {

            const tarjeta =
                document.createElement(
                    "article"
                );


            tarjeta.className =
                "member-card";


            const foto =
                persona.fotoUrl
                ||
                "./img/logo.jpg";


            tarjeta.innerHTML = `

                <img
                    class="member-photo"
                    src="${foto}"
                    alt=""
                    loading="lazy"
                >


                <div class="member-info">


                    <div class="member-id">
                        ${escapar(persona.id)}
                    </div>


                    <h3 class="member-name">

                        ${escapar(
                            persona.nombre
                            ||
                            "Sin nombre"
                        )}

                    </h3>


                    <div class="member-role">

                        ${escapar(
                            persona.cargo
                            ||
                            "Sin función"
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
                        Ver ficha
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
                    once: true
                }
            );


            lista.appendChild(
                tarjeta
            );

        }
    );

}



buscador.addEventListener(
    "input",
    () => {

        const texto =
            buscador.value
                .toLowerCase()
                .trim();


        const resultado =
            integrantes.filter(
                persona => {

                    const especialidades =
                        Array.isArray(
                            persona.especialidades
                        )
                            ? persona.especialidades
                                .join(" ")
                                .toLowerCase()
                            : "";


                    return (

                        String(
                            persona.nombre
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                        ||

                        String(
                            persona.id
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                        ||

                        String(
                            persona.cargo
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                        ||

                        String(
                            persona.delegacion
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                        ||

                        especialidades.includes(
                            texto
                        )

                    );

                }
            );


        mostrarIntegrantes(
            resultado
        );

    }
);



function escapar(
    valor
) {

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



cargarIntegrantes();
