
let integrantes = [];

const lista = document.getElementById("lista-integrantes");
const buscador = document.getElementById("buscador");
const cantidad = document.getElementById("cantidad");


async function cargarIntegrantes() {

    try {

        const respuesta = await fetch("./integrantes.json");

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar integrantes.json");
        }

        integrantes = await respuesta.json();

        mostrarIntegrantes(integrantes);

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

    }

}


function mostrarIntegrantes(datos) {

    lista.innerHTML = "";

    cantidad.textContent =
        `${datos.length} integrante${datos.length !== 1 ? "s" : ""}`;


    if (datos.length === 0) {

        lista.innerHTML = `
            <div class="no-results">
                No se encontraron integrantes.
            </div>
        `;

        return;

    }


    datos.forEach(persona => {

        const tarjeta = document.createElement("article");

        tarjeta.className = "member-card";


        const estadoTexto =
            persona.estado === "activo"
                ? "MIEMBRO ACTIVO"
                : "INACTIVO";


        tarjeta.innerHTML = `

            <img
                class="member-photo"
                src="./img/${persona.foto}"
                alt="${persona.nombre}"
            >

            <div class="member-info">

                <div class="member-id">
                    ${persona.id}
                </div>

                <h3 class="member-name">
                    ${persona.nombre}
                </h3>

                <div class="member-role">
                    ${persona.cargo}
                </div>


                <div class="status ${persona.estado}">

                    <span class="status-dot"></span>

                    ${estadoTexto}

                </div>


                <a
                    class="view-button"
                    href="./integrantes/${persona.slug}/"
                >
                    Ver credencial
                </a>

            </div>
        `;


        lista.appendChild(tarjeta);

    });

}


buscador.addEventListener(
    "input",
    () => {

        const texto =
            buscador.value
                .toLowerCase()
                .trim();


        const resultado =
            integrantes.filter(persona => {

                const especialidades =
                    persona.especialidades
                        .join(" ")
                        .toLowerCase();


                return (

                    persona.nombre
                        .toLowerCase()
                        .includes(texto)

                    ||

                    persona.id
                        .toLowerCase()
                        .includes(texto)

                    ||

                    persona.cargo
                        .toLowerCase()
                        .includes(texto)

                    ||

                    persona.delegacion
                        .toLowerCase()
                        .includes(texto)

                    ||

                    especialidades
                        .includes(texto)

                );

            });


        mostrarIntegrantes(resultado);

    }
);


cargarIntegrantes();
