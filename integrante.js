import {
    db
} from "./firebase-config.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


const loading =
    document.getElementById(
        "loading"
    );


const profile =
    document.getElementById(
        "profile"
    );


const inactiveBox =
    document.getElementById(
        "inactive-box"
    );


const errorBox =
    document.getElementById(
        "error-box"
    );


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



async function cargarIntegrante() {

    if (!id) {

        mostrarNoEncontrado();

        return;

    }


    try {

        const referencia =
            doc(
                db,
                "integrantes",
                id
            );


        const resultado =
            await getDoc(
                referencia
            );


        if (!resultado.exists()) {

            mostrarNoEncontrado();

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
            estado !== "activo"
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
            "Error consultando integrante:",
            error
        );


        mostrarErrorConsulta();

    }

}



function mostrarActivo(
    persona
) {

    loading.style.display =
        "none";


    inactiveBox.style.display =
        "none";


    errorBox.style.display =
        "none";


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
        function() {

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
        persona.nombre
        ||
        "Sin nombre";


    document.getElementById(
        "profile-role"
    ).textContent =
        persona.cargo
        ||
        "Sin función";


    completarCampo(
        "profile-dni",
        "dni-card",
        persona.dni
    );


    completarCampo(
        "profile-blood",
        "blood-card",
        persona.grupoSanguineo
    );


    completarCampo(
        "profile-delegation",
        "delegation-card",
        persona.delegacion
    );


    completarCampo(
        "profile-entry",
        "entry-card",
        persona.ingreso
    );


    mostrarEspecialidades(
        persona.especialidades
    );


    document.title =
        `${persona.nombre || persona.id} | SAR Argentina`;

}



function mostrarInactivo(
    persona
) {

    loading.style.display =
        "none";


    profile.style.display =
        "none";


    errorBox.style.display =
        "none";


    inactiveBox.style.display =
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
        "Integrante";


    document.title =
        "Credencial no vigente | SAR Argentina";

}



function mostrarNoEncontrado() {

    loading.style.display =
        "none";


    profile.style.display =
        "none";


    inactiveBox.style.display =
        "none";


    errorBox.style.display =
        "block";


    errorBox.innerHTML = `

        <div
            style="
                font-size:55px;
                margin-bottom:20px;
            "
        >
            ⚠️
        </div>


        <h2
            style="
                color:#a52a24;
                margin-bottom:10px;
            "
        >
            Integrante no encontrado
        </h2>


        <p
            style="
                color:#6e747d;
                line-height:1.6;
            "
        >

            No se encontraron datos
            asociados a esta identificación
            en la base de datos.

        </p>

    `;

}



function mostrarErrorConsulta() {

    loading.style.display =
        "none";


    profile.style.display =
        "none";


    inactiveBox.style.display =
        "none";


    errorBox.style.display =
        "block";


    errorBox.innerHTML = `

        <h2
            style="
                margin-bottom:10px;
                color:#a52a24;
            "
        >
            No se pudo verificar la credencial
        </h2>


        <p
            style="
                color:#6e747d;
            "
        >

            Ocurrió un problema al consultar
            el registro. Intentá nuevamente.

        </p>

    `;

}



function completarCampo(
    valorId,
    tarjetaId,
    valor
) {

    const tarjeta =
        document.getElementById(
            tarjetaId
        );


    if (
        valor === undefined
        ||
        valor === null
        ||
        String(valor).trim() === ""
    ) {

        tarjeta.style.display =
            "none";

        return;

    }


    tarjeta.style.display =
        "";


    document.getElementById(
        valorId
    ).textContent =
        valor;

}



function mostrarEspecialidades(
    especialidades
) {

    const seccion =
        document.getElementById(
            "specialties-section"
        );


    const lista =
        document.getElementById(
            "specialties-list"
        );


    lista.innerHTML =
        "";


    if (
        !Array.isArray(
            especialidades
        )
        ||
        especialidades.length === 0
    ) {

        seccion.style.display =
            "none";

        return;

    }


    seccion.style.display =
        "";


    especialidades.forEach(
        especialidad => {

            const elemento =
                document.createElement(
                    "span"
                );


            elemento.className =
                "specialty";


            elemento.textContent =
                especialidad;


            lista.appendChild(
                elemento
            );

        }
    );

}



cargarIntegrante();
