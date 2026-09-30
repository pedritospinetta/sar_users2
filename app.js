import {
    db
} from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


let integrantes = [];


const lista =
    document.getElementById("lista-integrantes");


const buscador =
    document.getElementById("buscador");


const cantidad =
    document.getElementById("cantidad");


const totalIntegrantes =
    document.getElementById("total-integrantes");



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


        integrantes = [];


        resultado.forEach(
            documento => {

                integrantes.push({

                    id:
                        documento.id,

                    ...documento.data()

                });

            }
        );


        integrantes.sort(
            (a, b) =>
                a.id.localeCompare(
                    b.id,
                    undefined,
                    {
                        numeric: true
                    }
                )
        );


        if (totalIntegrantes) {

            totalIntegrantes.textContent =
                integrantes.length;

        }


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
                No se pudo cargar el registro de integrantes.
            </div>
        `;


        if (cantidad) {

            cantidad.textContent =
                "Error de conexión";

        }

    }

}



function mostrarIntegrantes(datos) {

    lista.innerHTML =
        "";


    if (cantidad) {

        cantidad.textContent =
            `${datos.length} integrante${
                datos.length !== 1
                ? "s"
                : ""
            }`;

    }


    if (
        datos.length === 0
    ) {

        lista.innerHTML = `
            <div class="no-results">
                No se encontraron integrantes.
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


            const estado =
                (
                    persona.estado
                    ||
                    "inactivo"
                ).toLowerCase();


            const estadoTexto =
                estado === "activo"
                ? "MIEMBRO ACTIVO"
                : "MIEMBRO INACTIVO";


            const foto =
                persona.fotoUrl
                ||
                "./img/logo.jpg";


            tarjeta.innerHTML = `

                <img
                    class="member-photo"
                    src="${foto}"
                    alt="${persona.nombre || persona.id}"
                    loading="lazy"
                    onerror="this.src='./img/logo.jpg'"
                >


                <div class="member-info">


                    <div class="member-id">
                        ${persona.id}
                    </div>


                    <h3 class="member-name">
                        ${persona.nombre || "Sin nombre"}
                    </h3>


                    <div class="member-role">
                        ${persona.cargo || "Sin cargo"}
                    </div>


                    <div class="status ${estado}">

                        <span class="status-dot"></span>

                        ${estadoTexto}

                    </div>


                    <a
                        class="view-button"
                        href="./integrante.html?id=${encodeURIComponent(persona.id)}"
                    >
                        Ver ficha
                    </a>


                </div>

            `;


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

                        (
                            persona.nombre
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                        ||

                        (
                            persona.id
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                        ||

                        (
                            persona.cargo
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                        ||

                        (
                            persona.delegacion
                            ||
                            ""
                        )
                            .toLowerCase()
                            .includes(texto)

                        ||

                        (
                            persona.dni
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



cargarIntegrantes();
