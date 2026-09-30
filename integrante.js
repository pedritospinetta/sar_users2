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


const errorBox =
    document.getElementById(
        "error-box"
    );


const inactiveBox =
    document.getElementById(
        "inactive-box"
    );


const parametros =
    new URLSearchParams(
        window.location.search
    );


const id =
    (
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


        const documento =
            await getDoc(
                referencia
            );


        if (!documento.exists()) {

            mostrarNoEncontrado();

            return;

        }


        const persona = {

            id:
                documento.id,

            ...documento.data()

        };


        const estado =
            (
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


        mostrarPerfilActivo(
            persona
        );


    } catch (error) {

        console.error(
            "Error consultando integrante:",
            error
        );


        mostrarNoEncontrado();

    }

}


function mostrarPerfilActivo(
    persona
) {

    loading.style.display =
        "none";


    errorBox.style.display =
        "none";


    inactiveBox.style.display =
        "none";


    profile.style.display =
        "block";


    const foto =
        persona.fotoUrl
        ||
        "./img/logo.jpg";


    const profilePhoto =
        document.getElementById(
            "profile-photo"
        );


    profilePhoto.src =
        foto;


    profilePhoto.onerror =
        () => {

            profilePhoto.src =
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


    const specialtiesSection =
        document.getElementById(
            "specialties-section"
        );


    const specialtiesList =
        document.getElementById(
            "specialties-list"
        );


    specialtiesList.innerHTML =
        "";


    if (
        Array.isArray(
            persona.especialidades
        )
        &&
        persona.especialidades.length > 0
    ) {

        persona.especialidades.forEach(
            especialidad => {

                const chip =
                    document.createElement(
                        "span"
                    );


                chip.className =
                    "specialty";


                chip.textContent =
                    especialidad;


                specialtiesList.appendChild(
                    chip
                );

            }
        );

    } else {

        specialtiesSection.style.display =
            "none";

    }


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
        `Credencial no vigente | SAR Argentina`;

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
                font-size:52px;
                margin-bottom:18px;
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
                line-height:1.5;
            "
        >
            No se encontraron datos asociados a esta
            identificación en la base de datos.
        </p>

    `;

}


function completarCampo(
    valorId,
    cardId,
    valor
) {

    const card =
        document.getElementById(
            cardId
        );


    if (
        valor === undefined
        ||
        valor === null
        ||
        String(valor).trim() === ""
    ) {

        card.style.display =
            "none";

        return;

    }


    card.style.display =
        "";


    document.getElementById(
        valorId
    ).textContent =
        valor;

}


cargarIntegrante();
